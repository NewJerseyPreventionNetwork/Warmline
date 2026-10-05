type CountyEvent = { county?: string };
type CountyCallback = (
  error: Error | null,
  response: { valid: boolean; county: string | null },
) => void;

export const handler = async function (
  _context: Record<string, string | undefined>,
  event: CountyEvent,
  callback: CountyCallback,
) {
  const counties = [
    "Atlantic County", //works with atlantico
    "Bergen County",
    "Burlington County",
    "Camden County",
    "Cape May County",
    "Cumberland County",
    "Essex County",
    "Gloucester County",
    "Hudson County",
    "Hunterdon County",
    "Mercer County",
    "Middlesex County",
    "Monmouth County",
    "Morris County",
    "Ocean County",
    "Passaic County",
    "Salem County",
    "Somerset County",
    "Sussex County",
    "Union County",
    "Warren County",
    //special case for spanish
    "Cabo May", //-> cape may
    "Representative",
  ];

  //uses event county if exists or normalises to empty
  const spokenCounty = (event.county || "").trim().toLowerCase();

  //tries to find it in the array
  const match = counties.find((county) =>
    spokenCounty.includes(county.toLowerCase().replace(" county", "")),
  );

  callback(null, {
    valid: !!match, //returns true or false
    //returns it normalised
    county: match ? match.toLowerCase().replace(" county", "") : null,
  });
};
