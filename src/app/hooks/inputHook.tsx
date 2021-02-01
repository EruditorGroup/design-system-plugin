import {ChangeEvent, useState} from 'react';

type InputHook = (
  initialValue: string
) => [
  string,
  (value: string) => void,
  {value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void}
];
export const useInput: InputHook = initialValue => {
  const [value, setValue] = useState(initialValue);

  return [
    value,
    setValue,
    {
      value,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
      },
    },
  ];
};
