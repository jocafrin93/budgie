// Import Dependencies
import { RouterProvider } from "react-router";

// Local Imports
import { AuthProvider } from "app/contexts/auth/Provider";
import { BreakpointProvider } from "app/contexts/breakpoint/Provider";
import { LocaleProvider } from "app/contexts/locale/Provider";
import { SidebarProvider } from "app/contexts/sidebar/Provider";
import { DaisyThemeProvider } from "app/contexts/theme/DaisyProvider";
import router from "app/router/router";

// ----------------------------------------------------------------------

function App() {
  return (
    <AuthProvider>
      <DaisyThemeProvider>
        <LocaleProvider>
          <BreakpointProvider>
            <SidebarProvider>
              <RouterProvider router={router} />
            </SidebarProvider>
          </BreakpointProvider>
        </LocaleProvider>
      </DaisyThemeProvider>
    </AuthProvider>
  );
}

export default App;
