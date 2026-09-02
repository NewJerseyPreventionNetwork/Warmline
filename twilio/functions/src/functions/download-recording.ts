const jwt = require("jsonwebtoken");

declare namespace Twilio {
    class Response {
        setStatusCode(statusCode: number): void;
        appendHeader(name: string, value: string): void;
        setBody(body: unknown): void;
    }
}

type Recording = { sid: string };
type TwilioClient = {
    calls: (callSid: string) => {
        recordings: {
            list: () => Promise<Recording[]>;
        };
    };
};
type RuntimeContext = {
    ACCOUNT_SID?: string;
    AUTH_TOKEN?: string;
    SHARED_SECRET?: string;
    getTwilioClient: () => TwilioClient;
};
type DownloadEvent = {
    jwt?: string;
    request?: {
        headers?: {
            range?: string;
            Range?: string;
        };
    };
};
type DownloadCallback = (
    error: Error | null,
    response: Twilio.Response
) => void;

export const handler = async function(
    context: RuntimeContext,
    event: DownloadEvent,
    callback: DownloadCallback
) {
    try {
        const payload = jwt.verify(
            event.jwt,
            context.SHARED_SECRET
        );

        const callSid = payload.externalId;

        const client = context.getTwilioClient();

        const recordings = await client.calls(callSid).recordings.list();

        if (!recordings.length) {
            const response = new Twilio.Response();
            response.setStatusCode(404);
            response.setBody("Recording not found");
            return callback(null, response);
        }

        const recording = recordings[0];

        const url =
            `https://api.twilio.com/2010-04-01/Accounts/` +
            `${context.ACCOUNT_SID}/Recordings/${recording.sid}.wav`;

        const credentials =
            `${context.ACCOUNT_SID}:${context.AUTH_TOKEN}`;

        const encodedCredentials =
            Buffer.from(credentials).toString("base64");

        const recordingResponse = await fetch(url, {
            headers: {
                Authorization: `Basic ${encodedCredentials}`,
            },
        });

        if (!recordingResponse.ok) {
            throw new Error(
                `Twilio download failed (${recordingResponse.status}): ` +
                await recordingResponse.text()
            );
        }

        const buffer = Buffer.from(
            await recordingResponse.arrayBuffer()
        );

        const range =
            event.request?.headers?.range ||
            event.request?.headers?.Range;

        if (!range) {
            const response = new Twilio.Response();
            response.setStatusCode(200);
            response.appendHeader("Content-Type", "application/octet-stream");
            response.appendHeader(
                "Content-Disposition",
                `attachment; filename="${recording.sid}.wav"`
            );
            response.appendHeader("Accept-Ranges", "bytes");
            response.appendHeader("Content-Length", String(buffer.length));
            response.setBody(buffer);
            return callback(null, response);
        }

        const match = /^bytes=(\d+)-(\d*)$/.exec(range);

        if (!match) {
            const response = new Twilio.Response();
            response.setStatusCode(416);
            response.appendHeader("Content-Range", `bytes */${buffer.length}`);
            return callback(null, response);
        }

        const start = Number(match[1]);
        const requestedEnd = match[2]
            ? Number(match[2])
            : buffer.length - 1;
        const end = Math.min(requestedEnd, buffer.length - 1);

        if (start >= buffer.length || start > end) {
            const response = new Twilio.Response();
            response.setStatusCode(416);
            response.appendHeader("Content-Range", `bytes */${buffer.length}`);
            return callback(null, response);
        }

        const chunk = buffer.subarray(start, end + 1);
        const response = new Twilio.Response();

        response.setStatusCode(206);
        response.appendHeader("Content-Type", "application/octet-stream");
        response.appendHeader(
            "Content-Disposition",
            `attachment; filename="${recording.sid}.wav"`
        );
        response.appendHeader("Accept-Ranges", "bytes");
        response.appendHeader(
            "Content-Range",
            `bytes ${start}-${end}/${buffer.length}`
        );
        response.appendHeader("Content-Length", String(chunk.length));
        response.setBody(chunk);

        return callback(null, response);
    } catch (err) {
        console.error("download-recording failed:", err);

        const error = err instanceof Error ? err : new Error(String(err));
        const response = new Twilio.Response();
        response.appendHeader("Content-Type", "application/json");

        const jwtError =
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError";

        response.setStatusCode(jwtError ? 401 : 500);
        response.setBody({
            error: jwtError ? "Invalid or expired token" : error.message,
        });

        callback(null, response);
    }
};