import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const debounceValidator = (function () {
  let timeout: any = null;
  return (fn: (value: string) => Promise<any>, delay: number) => {
    return (value: string) =>
        new Promise(resolve => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            fn(value).then(v => {
              resolve(v);
            });
          }, delay);
        });
  };
});

export const createResourceUrl = (id: string, resource = "donation-pool") => {
  return `${import.meta.env.VITE_BACKEND_API}/${resource}/${id}`;
};