import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// O tema usa `text-vh-*` para duas coisas: tamanho quando termina em número
// (`text-vh-12` -> --text-vh-12) e cor quando é nome (`text-vh-muted` ->
// --color-vh-muted). Sem essa extensão o tailwind-merge joga as duas no mesmo
// grupo e descarta uma delas silenciosamente.
const isThemeFontSize = (value: string) => /^vh-\d/.test(value);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [isThemeFontSize] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
