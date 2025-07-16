// Import Dependencies
import { RouterProvider } from "react-router";

// Local Imports
import { AuthProvider } from "app/contexts/auth/Provider";
import { BreakpointProvider } from "app/contexts/breakpoint/Provider";
import { LocaleProvider } from "app/contexts/locale/Provider";
import { SidebarProvider } from "app/contexts/sidebar/Provider";
import { DaisyThemeProvider } from "app/contexts/theme/DaisyProvider";
import { ThemeProvider } from "app/contexts/theme/Provider";
import { CloudStorageProvider } from "./hooks/useCloudStorageManager.jsx";
import router from "app/router/router";

// ----------------------------------------------------------------------

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DaisyThemeProvider>
          <LocaleProvider>
            <BreakpointProvider>
              <SidebarProvider>
                <CloudStorageProvider>
                  <RouterProvider router={router} />
                </CloudStorageProvider>
              </SidebarProvider>
            </BreakpointProvider>
          </LocaleProvider>
        </DaisyThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
