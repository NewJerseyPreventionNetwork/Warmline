type CountyEvent = { pin?: string };
type CountyCallback = (error: Error | null, response: { county: string, valid: boolean }) => void;

export const handler = async function(
    _context: Record<string, string | undefined>,
    event: CountyEvent,
    callback: CountyCallback
) {

    const countyMap: Record<string, string> = {
        "285": "atlantic",
        "237": "bergen",
        "287": "burlington",
        "226": "camden",
        "227": "cape may",
        "286": "cumberland",
        "377": "essex",
        "456": "gloucester",
        "483": "hudson",
        "486": "hunterdon",
        "637": "mercer",
        "643": "middlesex",
        "666": "monmouth",
        "667": "morris",
        "623": "ocean",
        "727": "passaic",
        "725": "salem",
        "766": "somerset",
        "787": "sussex",
        "864": "union",
        "927": "warren"
    };

    const DEFAULT_COUNTY = "atlantic";

    const givenCounty = (event.pin || "").trim();

    const countyName = countyMap[givenCounty];
    const valid = countyName !== undefined;

    // Fall back to the default if the county wasn't found in the map, not just if it was empty
    callback(null, {
        county: countyName || DEFAULT_COUNTY,
        valid
    });
};