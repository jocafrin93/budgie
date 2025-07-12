import { createSafeContext } from "utils/createSafeContext";

export const [DaisyThemeContext, useDaisyThemeContext] = createSafeContext(
    "useDaisyThemeContext must be used within DaisyThemeProvider",
);
