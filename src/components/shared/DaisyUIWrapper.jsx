import { useDaisyThemeContext } from 'app/contexts/theme/DaisyContext';
import { useEffect } from 'react';

// Import DaisyUI styles as CSS modules or inline
const daisyThemesCSS = `
/* DaisyUI Theme Variables */
[data-theme="light"] {
  --color-primary: 59 130 246;
  --color-primary-focus: 37 99 235;
  --color-primary-content: 255 255 255;
  --color-secondary: 244 63 94;
  --color-secondary-focus: 225 29 72;
  --color-secondary-content: 255 255 255;
  --color-accent: 34 197 94;
  --color-accent-focus: 22 163 74;
  --color-accent-content: 255 255 255;
  --color-neutral: 71 85 105;
  --color-neutral-focus: 51 65 85;
  --color-neutral-content: 255 255 255;
  --color-base-100: 255 255 255;
  --color-base-200: 248 250 252;
  --color-base-300: 226 232 240;
  --color-base-content: 15 23 42;
  --color-info: 14 165 233;
  --color-info-content: 255 255 255;
  --color-success: 34 197 94;
  --color-success-content: 255 255 255;
  --color-warning: 251 146 60;
  --color-warning-content: 255 255 255;
  --color-error: 239 68 68;
  --color-error-content: 255 255 255;
}

[data-theme="dark"] {
  --color-primary: 96 165 250;
  --color-primary-focus: 59 130 246;
  --color-primary-content: 15 23 42;
  --color-secondary: 251 113 133;
  --color-secondary-focus: 244 63 94;
  --color-secondary-content: 15 23 42;
  --color-accent: 74 222 128;
  --color-accent-focus: 34 197 94;
  --color-accent-content: 15 23 42;
  --color-neutral: 148 163 184;
  --color-neutral-focus: 100 116 139;
  --color-neutral-content: 15 23 42;
  --color-base-100: 30 41 59;
  --color-base-200: 51 65 85;
  --color-base-300: 71 85 105;
  --color-base-content: 248 250 252;
  --color-info: 56 189 248;
  --color-info-content: 15 23 42;
  --color-success: 74 222 128;
  --color-success-content: 15 23 42;
  --color-warning: 251 191 36;
  --color-warning-content: 15 23 42;
  --color-error: 248 113 113;
  --color-error-content: 15 23 42;
}

[data-theme="cupcake"] {
  --color-primary: 101 163 13;
  --color-primary-focus: 77 124 15;
  --color-primary-content: 255 255 255;
  --color-secondary: 244 114 182;
  --color-secondary-focus: 236 72 153;
  --color-secondary-content: 255 255 255;
  --color-accent: 251 146 60;
  --color-accent-focus: 249 115 22;
  --color-accent-content: 255 255 255;
  --color-neutral: 41 37 36;
  --color-neutral-focus: 28 25 23;
  --color-neutral-content: 255 255 255;
  --color-base-100: 250 245 255;
  --color-base-200: 243 232 255;
  --color-base-300: 233 213 255;
  --color-base-content: 41 37 36;
  --color-info: 14 165 233;
  --color-info-content: 255 255 255;
  --color-success: 34 197 94;
  --color-success-content: 255 255 255;
  --color-warning: 251 146 60;
  --color-warning-content: 255 255 255;
  --color-error: 239 68 68;
  --color-error-content: 255 255 255;
}

[data-theme="corporate"] {
  --color-primary: 37 99 235;
  --color-primary-focus: 29 78 216;
  --color-primary-content: 255 255 255;
  --color-secondary: 100 116 139;
  --color-secondary-focus: 71 85 105;
  --color-secondary-content: 255 255 255;
  --color-accent: 34 197 94;
  --color-accent-focus: 22 163 74;
  --color-accent-content: 255 255 255;
  --color-neutral: 71 85 105;
  --color-neutral-focus: 51 65 85;
  --color-neutral-content: 255 255 255;
  --color-base-100: 255 255 255;
  --color-base-200: 248 250 252;
  --color-base-300: 226 232 240;
  --color-base-content: 15 23 42;
  --color-info: 14 165 233;
  --color-info-content: 255 255 255;
  --color-success: 34 197 94;
  --color-success-content: 255 255 255;
  --color-warning: 251 146 60;
  --color-warning-content: 255 255 255;
  --color-error: 239 68 68;
  --color-error-content: 255 255 255;
}

[data-theme="synthwave"] {
  --color-primary: 236 72 153;
  --color-primary-focus: 219 39 119;
  --color-primary-content: 255 255 255;
  --color-secondary: 168 85 247;
  --color-secondary-focus: 147 51 234;
  --color-secondary-content: 255 255 255;
  --color-accent: 34 211 238;
  --color-accent-focus: 6 182 212;
  --color-accent-content: 15 23 42;
  --color-neutral: 30 41 59;
  --color-neutral-focus: 15 23 42;
  --color-neutral-content: 255 255 255;
  --color-base-100: 15 23 42;
  --color-base-200: 30 41 59;
  --color-base-300: 51 65 85;
  --color-base-content: 255 255 255;
  --color-info: 14 165 233;
  --color-info-content: 255 255 255;
  --color-success: 34 197 94;
  --color-success-content: 255 255 255;
  --color-warning: 251 146 60;
  --color-warning-content: 255 255 255;
  --color-error: 239 68 68;
  --color-error-content: 255 255 255;
}

[data-theme="retro"] {
  --color-primary: 239 68 68;
  --color-primary-focus: 220 38 38;
  --color-primary-content: 255 255 255;
  --color-secondary: 251 146 60;
  --color-secondary-focus: 249 115 22;
  --color-secondary-content: 255 255 255;
  --color-accent: 34 197 94;
  --color-accent-focus: 22 163 74;
  --color-accent-content: 255 255 255;
  --color-neutral: 120 113 108;
  --color-neutral-focus: 87 83 78;
  --color-neutral-content: 255 255 255;
  --color-base-100: 254 252 232;
  --color-base-200: 254 240 138;
  --color-base-300: 253 224 71;
  --color-base-content: 87 83 78;
  --color-info: 14 165 233;
  --color-info-content: 255 255 255;
  --color-success: 34 197 94;
  --color-success-content: 255 255 255;
  --color-warning: 251 146 60;
  --color-warning-content: 255 255 255;
  --color-error: 239 68 68;
  --color-error-content: 255 255 255;
}

[data-theme="cyberpunk"] {
  --color-primary: 255 119 0;
  --color-primary-focus: 234 88 12;
  --color-primary-content: 255 255 255;
  --color-secondary: 255 20 147;
  --color-secondary-focus: 219 39 119;
  --color-secondary-content: 255 255 255;
  --color-accent: 0 255 255;
  --color-accent-focus: 6 182 212;
  --color-accent-content: 15 23 42;
  --color-neutral: 30 41 59;
  --color-neutral-focus: 15 23 42;
  --color-neutral-content: 255 255 255;
  --color-base-100: 15 23 42;
  --color-base-200: 30 41 59;
  --color-base-300: 51 65 85;
  --color-base-content: 255 255 255;
  --color-info: 14 165 233;
  --color-info-content: 255 255 255;
  --color-success: 34 197 94;
  --color-success-content: 255 255 255;
  --color-warning: 251 146 60;
  --color-warning-content: 255 255 255;
  --color-error: 239 68 68;
  --color-error-content: 255 255 255;
}

[data-theme="valentine"] {
  --color-primary: 225 29 72;
  --color-primary-focus: 190 18 60;
  --color-primary-content: 255 255 255;
  --color-secondary: 244 114 182;
  --color-secondary-focus: 236 72 153;
  --color-secondary-content: 255 255 255;
  --color-accent: 251 146 60;
  --color-accent-focus: 249 115 22;
  --color-accent-content: 255 255 255;
  --color-neutral: 120 113 108;
  --color-neutral-focus: 87 83 78;
  --color-neutral-content: 255 255 255;
  --color-base-100: 254 242 242;
  --color-base-200: 254 226 226;
  --color-base-300: 252 165 165;
  --color-base-content: 87 83 78;
  --color-info: 14 165 233;
  --color-info-content: 255 255 255;
  --color-success: 34 197 94;
  --color-success-content: 255 255 255;
  --color-warning: 251 146 60;
  --color-warning-content: 255 255 255;
  --color-error: 239 68 68;
  --color-error-content: 255 255 255;
}

[data-theme="forest"] {
  --color-primary: 34 197 94;
  --color-primary-focus: 22 163 74;
  --color-primary-content: 0 0 0;
  --color-secondary: 101 163 13;
  --color-secondary-focus: 77 124 15;
  --color-secondary-content: 36 36 36;
  --color-accent: 217 119 6;
  --color-accent-focus: 180 83 9;
  --color-accent-content: 36 36 36;
  --color-neutral: 78 78 78;
  --color-neutral-focus: 66 66 66;
  --color-neutral-content: 219 219 219;
  --color-base-100: 53 53 53;
  --color-base-200: 47 47 47;
  --color-base-300: 41 41 41;
  --color-base-content: 213 213 213;
  --color-info: 14 165 233;
  --color-info-content: 0 0 0;
  --color-success: 34 197 94;
  --color-success-content: 0 0 0;
  --color-warning: 245 158 11;
  --color-warning-content: 0 0 0;
  --color-error: 239 68 68;
  --color-error-content: 0 0 0;
}

[data-theme="aqua"] {
  --color-primary: 6 182 212;
  --color-primary-focus: 8 145 178;
  --color-primary-content: 255 255 255;
  --color-secondary: 34 211 238;
  --color-secondary-focus: 14 165 233;
  --color-secondary-content: 255 255 255;
  --color-accent: 168 85 247;
  --color-accent-focus: 147 51 234;
  --color-accent-content: 255 255 255;
  --color-neutral: 30 41 59;
  --color-neutral-focus: 15 23 42;
  --color-neutral-content: 255 255 255;
  --color-base-100: 240 253 255;
  --color-base-200: 207 250 254;
  --color-base-300: 165 243 252;
  --color-base-content: 15 23 42;
  --color-info: 14 165 233;
  --color-info-content: 255 255 255;
  --color-success: 34 197 94;
  --color-success-content: 255 255 255;
  --color-warning: 251 146 60;
  --color-warning-content: 255 255 255;
  --color-error: 239 68 68;
  --color-error-content: 255 255 255;
}

/* DaisyUI Utility Classes */
.bg-primary { background-color: rgb(var(--color-primary)) !important; }
.bg-primary-focus { background-color: rgb(var(--color-primary-focus)) !important; }
.bg-secondary { background-color: rgb(var(--color-secondary)) !important; }
.bg-secondary-focus { background-color: rgb(var(--color-secondary-focus)) !important; }
.bg-accent { background-color: rgb(var(--color-accent)) !important; }
.bg-accent-focus { background-color: rgb(var(--color-accent-focus)) !important; }
.bg-neutral { background-color: rgb(var(--color-neutral)) !important; }
.bg-neutral-focus { background-color: rgb(var(--color-neutral-focus)) !important; }
.bg-base-100 { background-color: rgb(var(--color-base-100)) !important; }
.bg-base-200 { background-color: rgb(var(--color-base-200)) !important; }
.bg-base-300 { background-color: rgb(var(--color-base-300)) !important; }
.bg-info { background-color: rgb(var(--color-info)) !important; }
.bg-success { background-color: rgb(var(--color-success)) !important; }
.bg-warning { background-color: rgb(var(--color-warning)) !important; }
.bg-error { background-color: rgb(var(--color-error)) !important; }

.text-primary { color: rgb(var(--color-primary)) !important; }
.text-primary-content { color: rgb(var(--color-primary-content)) !important; }
.text-secondary-content { color: rgb(var(--color-secondary-content)) !important; }
.text-accent-content { color: rgb(var(--color-accent-content)) !important; }
.text-neutral-content { color: rgb(var(--color-neutral-content)) !important; }
.text-base-content { color: rgb(var(--color-base-content)) !important; }
.text-info-content { color: rgb(var(--color-info-content)) !important; }
.text-success-content { color: rgb(var(--color-success-content)) !important; }
.text-warning-content { color: rgb(var(--color-warning-content)) !important; }
.text-error-content { color: rgb(var(--color-error-content)) !important; }

.border-base-300 { border-color: rgb(var(--color-base-300)) !important; }

.daisy-wrapper .btn-primary {
  background-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary-content));
}
.daisy-wrapper .btn-primary:hover {
  background-color: rgb(var(--color-primary-focus));
}

.daisy-wrapper .btn-secondary {
  background-color: rgb(var(--color-secondary));
  color: rgb(var(--color-secondary-content));
}
.daisy-wrapper .btn-secondary:hover {
  background-color: rgb(var(--color-secondary-focus));
}

.daisy-wrapper .btn-accent {
  background-color: rgb(var(--color-accent));
  color: rgb(var(--color-accent-content));
}
.daisy-wrapper .btn-accent:hover {
  background-color: rgb(var(--color-accent-focus));
}

.daisy-wrapper .btn-neutral {
  background-color: rgb(var(--color-neutral));
  color: rgb(var(--color-neutral-content));
}
.daisy-wrapper .btn-neutral:hover {
  background-color: rgb(var(--color-neutral-focus));
}

.daisy-wrapper .btn-outline-primary {
  border: 1px solid rgb(var(--color-primary));
  color: rgb(var(--color-primary));
  background-color: transparent;
}
.daisy-wrapper .btn-outline-primary:hover {
  background-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary-content));
}

.daisy-wrapper .btn-outline-secondary {
  border: 1px solid rgb(var(--color-secondary));
  color: rgb(var(--color-secondary));
  background-color: transparent;
}
.daisy-wrapper .btn-outline-secondary:hover {
  background-color: rgb(var(--color-secondary));
  color: rgb(var(--color-secondary-content));
}

.daisy-wrapper .btn-outline-accent {
  border: 1px solid rgb(var(--color-accent));
  color: rgb(var(--color-accent));
  background-color: transparent;
}
.daisy-wrapper .btn-outline-accent:hover {
  background-color: rgb(var(--color-accent));
  color: rgb(var(--color-accent-content));
}

.daisy-wrapper .alert {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}
.daisy-wrapper .alert-info {
  background-color: rgb(var(--color-info));
  color: rgb(var(--color-info-content));
}
.daisy-wrapper .alert-success {
  background-color: rgb(var(--color-success));
  color: rgb(var(--color-success-content));
}
.daisy-wrapper .alert-warning {
  background-color: rgb(var(--color-warning));
  color: rgb(var(--color-warning-content));
}
.daisy-wrapper .alert-error {
  background-color: rgb(var(--color-error));
  color: rgb(var(--color-error-content));
}

.daisy-wrapper .badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}
.daisy-wrapper .badge-primary {
  background-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary-content));
}
.daisy-wrapper .badge-secondary {
  background-color: rgb(var(--color-secondary));
  color: rgb(var(--color-secondary-content));
}
.daisy-wrapper .badge-accent {
  background-color: rgb(var(--color-accent));
  color: rgb(var(--color-accent-content));
}
.daisy-wrapper .badge-neutral {
  background-color: rgb(var(--color-neutral));
  color: rgb(var(--color-neutral-content));
}
.daisy-wrapper .badge-info {
  background-color: rgb(var(--color-info));
  color: rgb(var(--color-info-content));
}
.daisy-wrapper .badge-success {
  background-color: rgb(var(--color-success));
  color: rgb(var(--color-success-content));
}
.daisy-wrapper .badge-warning {
  background-color: rgb(var(--color-warning));
  color: rgb(var(--color-warning-content));
}
.daisy-wrapper .badge-error {
  background-color: rgb(var(--color-error));
  color: rgb(var(--color-error-content));
}

.daisy-wrapper .input {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(var(--color-base-300));
  border-radius: 0.375rem;
  background-color: rgb(var(--color-base-100));
  color: rgb(var(--color-base-content));
}
.daisy-wrapper .input:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 2px rgb(var(--color-primary) / 0.2);
}
.daisy-wrapper .input-primary:focus {
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 2px rgb(var(--color-primary) / 0.2);
}
.daisy-wrapper .input-secondary:focus {
  border-color: rgb(var(--color-secondary));
  box-shadow: 0 0 0 2px rgb(var(--color-secondary) / 0.2);
}
.daisy-wrapper .input-accent:focus {
  border-color: rgb(var(--color-accent));
  box-shadow: 0 0 0 2px rgb(var(--color-accent) / 0.2);
}
`;

export default function DaisyUIWrapper({ children }) {
  const { currentTheme } = useDaisyThemeContext();

  useEffect(() => {
    // Inject styles if not already present
    const styleId = 'daisy-ui-scoped-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = daisyThemesCSS;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="daisy-wrapper" data-theme={currentTheme}>
      {children}
    </div>
  );
}
