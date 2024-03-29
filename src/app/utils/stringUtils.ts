type StringTransformer = (value: string) => string;

export const capitalizeFirstLetter: StringTransformer = str =>
  str[0].toUpperCase() + str.slice(1);

export const lowerFirstLetter: StringTransformer = str =>
  str[0].toLowerCase() + str.slice(1);
