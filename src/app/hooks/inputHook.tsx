import {useState} from 'react';

interface HandleValueChangeInterface {
  target: HTMLInputElement;
}

export const useInput = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);

  return [value, setValue, {
    value,
    onChange: (event: HandleValueChangeInterface) => {
      setValue(event.target.value);
    },
  }];
};
