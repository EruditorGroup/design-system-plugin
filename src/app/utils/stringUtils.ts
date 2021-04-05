type FirstLetterCapitalizer = (str: string) => string;
export const capitalizeFirstLetter: FirstLetterCapitalizer = str =>
  str.charAt(0).toUpperCase() + str.slice(1);

type FirstLetterLowerer = (str: string) => string;
export const lowerFirstLetter: FirstLetterLowerer = str =>
  str.charAt(0).toLowerCase() + str.slice(1);
