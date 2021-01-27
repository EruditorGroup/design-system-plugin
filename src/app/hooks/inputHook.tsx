import {useState} from 'react';

type HandleValueChangeInterface = {
  target: HTMLInputElement;
};

type InputHook = (
  initialValue: string
) => [
  string,
  (value: string) => void,
  {value: string; onChange: (event: HandleValueChangeInterface) => void}
];
export const useInput: InputHook = initialValue => {
  const [value, setValue] = useState(initialValue);

  return [
    value,
    setValue,
    {
      value,
      onChange: (event: HandleValueChangeInterface) => {
        setValue(event.target.value);
      },
    },
  ];
};
