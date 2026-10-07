type CountyEvent = { county?: string };
type NumberCallback = (
  error: Error | null,
  response: { number: string | undefined },
) => void;

export const handler = async function (
  context: Record<string, string | undefined>,
  event: CountyEvent,
  callback: NumberCallback,
) {
  const countyMap: Record<string, string | undefined> = {
    atlantic: context.ATLANTIC_NUMBER,
    bergen: context.BERGEN_NUMBER,
    burlington: context.BURLINGTON_NUMBER,
    camden: context.CAMDEN_NUMBER,
    "cape may": context.CAPE_MAY_NUMBER,
    cumberland: context.CUMBERLAND_NUMBER,
    essex: context.ESSEX_NUMBER,
    gloucester: context.GLOUCESTER_NUMBER,
    hudson: context.HUDSON_NUMBER,
    hunterdon: context.HUNTERDON_NUMBER,
    mercer: context.MERCER_NUMBER,
    middlesex: context.MIDDLESEX_NUMBER,
    monmouth: context.MONMOUTH_NUMBER,
    morris: context.MORRIS_NUMBER,
    ocean: context.OCEAN_NUMBER,
    passaic: context.PASSAIC_NUMBER,
    salem: context.SALEM_NUMBER,
    somerset: context.SOMERSET_NUMBER,
    sussex: context.SUSSEX_NUMBER,
    union: context.UNION_NUMBER,
    warren: context.WARREN_NUMBER,
    "cabo may": context.CAPE_MAY_NUMBER,
    representative: "",
  };

  const spokenCounty = (event.county || "").toLowerCase().trim();

  console.log("spokenCounty:", spokenCounty);

  const assignedNumber = countyMap[spokenCounty];

  console.log("assignedNumber:", assignedNumber);

  callback(null, {
    number: assignedNumber,
  });
};
