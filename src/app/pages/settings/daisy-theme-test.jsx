import { useDaisyThemeContext } from 'app/contexts/theme/DaisyContext';
import DaisyThemeSwitcher from 'components/shared/DaisyThemeSwitcher';
import DaisyUIWrapper from 'components/shared/DaisyUIWrapper';

export default function DaisyThemeTest() {
    const { currentTheme, changeTheme } = useDaisyThemeContext();

    const CodeBlock = ({ children, title }) => (
        <div className="bg-base-300 p-3 rounded-md mt-2">
            {title && <div className="text-xs font-semibold text-base-content/80 mb-1">{title}</div>}
            <code className="text-xs text-base-content/90 font-mono">{children}</code>
        </div>
    );

    const ConversionExample = ({ before, after, description }) => (
        <div className="bg-base-300/50 p-3 rounded-md border border-base-300">
            <div className="text-sm font-medium text-base-content mb-2">{description}</div>
            <div className="space-y-2">
                <div>
                    <span className="text-xs font-semibold text-error">❌ OLD (Tailux):</span>
                    <code className="text-xs text-base-content/80 font-mono ml-2">{before}</code>
                </div>
                <div>
                    <span className="text-xs font-semibold text-success">✅ NEW (DaisyUI):</span>
                    <code className="text-xs text-base-content/80 font-mono ml-2">{after}</code>
                </div>
            </div>
        </div>
    );

    return (
        <DaisyUIWrapper>
            <div className="min-h-screen bg-base-100 p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-base-content mb-2">
                            DaisyUI Theme System Guide
                        </h1>
                        <p className="text-base-content/60">
                            Complete reference for converting Tailux colors to DaisyUI semantic classes
                        </p>
                    </div>

                    {/* Theme Switcher */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            Theme Selector
                        </h2>
                        <div className="max-w-sm">
                            <DaisyThemeSwitcher
                                currentTheme={currentTheme}
                                onThemeChange={changeTheme}
                            />
                        </div>
                        <p className="text-sm text-base-content/60 mt-2">
                            Current theme: <span className="font-medium">{currentTheme}</span>
                        </p>
                        <CodeBlock title="CSS Variables Used">
                            className=bg-base-200 text-base-content
                        </CodeBlock>
                    </div>

                    {/* Conversion Guide */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            🔄 Common Conversion Patterns
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ConversionExample
                                description="Background Colors"
                                before="bg-white dark:bg-dark-900"
                                after="bg-base-100"
                            />
                            <ConversionExample
                                description="Text Colors"
                                before="text-gray-900 dark:text-dark-100"
                                after="text-base-content"
                            />
                            <ConversionExample
                                description="Secondary Text"
                                before="text-gray-500 dark:text-dark-300"
                                after="text-base-content/60"
                            />
                            <ConversionExample
                                description="Border Colors"
                                before="border-gray-200 dark:border-dark-600"
                                after="border-base-300"
                            />
                            <ConversionExample
                                description="Primary Colors"
                                before="text-primary-600 dark:text-primary-400"
                                after="text-primary"
                            />
                            <ConversionExample
                                description="Hover States"
                                before="hover:bg-gray-100 dark:hover:bg-dark-800"
                                after="hover:bg-base-200"
                            />
                        </div>
                    </div>

                    {/* What to Look For */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            🔍 What to Look For When Converting
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-base-content mb-3">❌ Replace These Patterns:</h3>
                                <ul className="space-y-2 text-sm text-base-content/80">
                                    <li>• <code className="bg-base-300 px-1 rounded">bg-white</code> → <code className="bg-base-300 px-1 rounded">bg-base-100</code></li>
                                    <li>• <code className="bg-base-300 px-1 rounded">bg-gray-*</code> → <code className="bg-base-300 px-1 rounded">bg-base-*</code></li>
                                    <li>• <code className="bg-base-300 px-1 rounded">text-gray-*</code> → <code className="bg-base-300 px-1 rounded">text-base-content/*</code></li>
                                    <li>• <code className="bg-base-300 px-1 rounded">border-gray-*</code> → <code className="bg-base-300 px-1 rounded">border-base-300</code></li>
                                    <li>• <code className="bg-base-300 px-1 rounded">dark:*</code> conditionals → semantic classes</li>
                                    <li>• <code className="bg-base-300 px-1 rounded">text-primary-600</code> → <code className="bg-base-300 px-1 rounded">text-primary</code></li>
                                    <li>• <code className="bg-base-300 px-1 rounded">bg-indigo-*</code> → <code className="bg-base-300 px-1 rounded">bg-primary</code></li>
                                    <li>• <code className="bg-base-300 px-1 rounded">text-slate-*</code> → <code className="bg-base-300 px-1 rounded">text-base-content/*</code></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-base-content mb-3">✅ Use These Instead:</h3>
                                <ul className="space-y-2 text-sm text-base-content/80">
                                    <li>• <code className="bg-base-300 px-1 rounded">bg-base-100</code> - Main background</li>
                                    <li>• <code className="bg-base-300 px-1 rounded">bg-base-200</code> - Secondary background</li>
                                    <li>• <code className="bg-base-300 px-1 rounded">bg-base-300</code> - Borders, dividers</li>
                                    <li>• <code className="bg-base-300 px-1 rounded">text-base-content</code> - Primary text</li>
                                    <li>• <code className="bg-base-300 px-1 rounded">text-base-content/60</code> - Secondary text</li>
                                    <li>• <code className="bg-base-300 px-1 rounded">text-primary</code> - Primary color text</li>
                                    <li>• <code className="bg-base-300 px-1 rounded">bg-primary</code> - Primary backgrounds</li>
                                    <li>• <code className="bg-base-300 px-1 rounded">border-base-300</code> - All borders</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Color Palette Demo */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            🎨 Color Palette Reference
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <div className="w-full h-16 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="text-primary-content font-medium">Primary</span>
                                </div>
                                <div className="w-full h-12 bg-primary-focus rounded-lg flex items-center justify-center">
                                    <span className="text-primary-content text-sm">Focus</span>
                                </div>
                                <CodeBlock>
                                    bg-primary text-primary-content<br />
                                    CSS: rgb(var(--color-primary))
                                </CodeBlock>
                            </div>

                            <div className="space-y-2">
                                <div className="w-full h-16 bg-secondary rounded-lg flex items-center justify-center">
                                    <span className="text-secondary-content font-medium">Secondary</span>
                                </div>
                                <div className="w-full h-12 bg-secondary-focus rounded-lg flex items-center justify-center">
                                    <span className="text-secondary-content text-sm">Focus</span>
                                </div>
                                <CodeBlock>
                                    bg-secondary text-secondary-content<br />
                                    CSS: rgb(var(--color-secondary))
                                </CodeBlock>
                            </div>

                            <div className="space-y-2">
                                <div className="w-full h-16 bg-accent rounded-lg flex items-center justify-center">
                                    <span className="text-accent-content font-medium">Accent</span>
                                </div>
                                <div className="w-full h-12 bg-accent-focus rounded-lg flex items-center justify-center">
                                    <span className="text-accent-content text-sm">Focus</span>
                                </div>
                                <CodeBlock>
                                    bg-accent text-accent-content<br />
                                    CSS: rgb(var(--color-accent))
                                </CodeBlock>
                            </div>

                            <div className="space-y-2">
                                <div className="w-full h-16 bg-neutral rounded-lg flex items-center justify-center">
                                    <span className="text-neutral-content font-medium">Neutral</span>
                                </div>
                                <div className="w-full h-12 bg-neutral-focus rounded-lg flex items-center justify-center">
                                    <span className="text-neutral-content text-sm">Focus</span>
                                </div>
                                <CodeBlock>
                                    bg-neutral text-neutral-content<br />
                                    CSS: rgb(var(--color-neutral))
                                </CodeBlock>
                            </div>
                        </div>
                    </div>

                    {/* Base Colors */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            🏠 Base Colors (Most Important)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                                <div className="text-base-content font-medium">Base 100</div>
                                <div className="text-base-content/60 text-sm mb-2">Main background</div>
                                <CodeBlock>
                                    className=&#34;bg-base-100&#34;<br />
                                    CSS: rgb(var(--color-base-100))<br />
                                    Replaces: bg-white, bg-gray-50
                                </CodeBlock>
                            </div>
                            <div className="bg-base-200 p-4 rounded-lg border border-base-300">
                                <div className="text-base-content font-medium">Base 200</div>
                                <div className="text-base-content/60 text-sm mb-2">Secondary background</div>
                                <CodeBlock>
                                    className=bg-base-200<br />
                                    CSS: rgb(var(--color-base-200))<br />
                                    Replaces: bg-gray-100, bg-slate-100
                                </CodeBlock>
                            </div>
                            <div className="bg-base-300 p-4 rounded-lg border border-base-300">
                                <div className="text-base-content font-medium">Base 300</div>
                                <div className="text-base-content/60 text-sm mb-2">Borders & dividers</div>
                                <CodeBlock>
                                    className=border-base-300<br />
                                    CSS: rgb(var(--color-base-300))<br />
                                    Replaces: border-gray-200, border-slate-300
                                </CodeBlock>
                            </div>
                        </div>
                    </div>

                    {/* Text Colors */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            📝 Text Color Examples
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-base-100 rounded-lg border border-base-300">
                                <div className="text-base-content text-lg font-semibold">Primary Text</div>
                                <div className="text-base-content/80 text-base">Secondary Text (80% opacity)</div>
                                <div className="text-base-content/60 text-sm">Muted Text (60% opacity)</div>
                                <div className="text-base-content/40 text-xs">Disabled Text (40% opacity)</div>
                                <CodeBlock title="Text Classes Used">
                                    text-base-content (100%)<br />
                                    text-base-content/80 (80% opacity)<br />
                                    text-base-content/60 (60% opacity)<br />
                                    text-base-content/40 (40% opacity)
                                </CodeBlock>
                            </div>
                        </div>
                    </div>

                    {/* Button Examples */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            🔘 Button Examples
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-3">
                                <button className="btn btn-primary w-full">Primary Button</button>
                                <CodeBlock>
                                    className=btn btn-primary<br />
                                    Uses: bg-primary text-primary-content
                                </CodeBlock>
                            </div>
                            <div className="space-y-3">
                                <button className="btn btn-secondary w-full">Secondary Button</button>
                                <CodeBlock>
                                    className=btn btn-secondary<br />
                                    Uses: bg-secondary text-secondary-content
                                </CodeBlock>
                            </div>
                            <div className="space-y-3">
                                <button className="btn btn-accent w-full">Accent Button</button>
                                <CodeBlock>
                                    className=btn btn-accent<br />
                                    Uses: bg-accent text-accent-content
                                </CodeBlock>
                            </div>
                            <div className="space-y-3">
                                <button className="btn btn-ghost w-full">Ghost Button</button>
                                <CodeBlock>
                                    className=btn btn-ghost<br />
                                    Uses: transparent bg, text-base-content
                                </CodeBlock>
                            </div>
                        </div>
                    </div>

                    {/* Status Colors */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            🚦 Status Colors
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <div className="w-full h-12 bg-success rounded-lg flex items-center justify-center">
                                    <span className="text-success-content font-medium">Success</span>
                                </div>
                                <CodeBlock>
                                    bg-success text-success-content<br />
                                    CSS: rgb(var(--color-success))
                                </CodeBlock>
                            </div>
                            <div className="space-y-2">
                                <div className="w-full h-12 bg-warning rounded-lg flex items-center justify-center">
                                    <span className="text-warning-content font-medium">Warning</span>
                                </div>
                                <CodeBlock>
                                    bg-warning text-warning-content<br />
                                    CSS: rgb(var(--color-warning))
                                </CodeBlock>
                            </div>
                            <div className="space-y-2">
                                <div className="w-full h-12 bg-error rounded-lg flex items-center justify-center">
                                    <span className="text-error-content font-medium">Error</span>
                                </div>
                                <CodeBlock>
                                    bg-error text-error-content<br />
                                    CSS: rgb(var(--color-error))
                                </CodeBlock>
                            </div>
                            <div className="space-y-2">
                                <div className="w-full h-12 bg-info rounded-lg flex items-center justify-center">
                                    <span className="text-info-content font-medium">Info</span>
                                </div>
                                <CodeBlock>
                                    bg-info text-info-content<br />
                                    CSS: rgb(var(--color-info))
                                </CodeBlock>
                            </div>
                        </div>
                    </div>

                    {/* CSS Variable Reference */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            🔧 CSS Variable Reference
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-base-content mb-3">DaisyUI Variables:</h3>
                                <CodeBlock>
                                    --color-primary<br />
                                    --color-primary-focus<br />
                                    --color-primary-content<br />
                                    --color-secondary<br />
                                    --color-secondary-focus<br />
                                    --color-secondary-content<br />
                                    --color-accent<br />
                                    --color-accent-focus<br />
                                    --color-accent-content<br />
                                    --color-neutral<br />
                                    --color-neutral-focus<br />
                                    --color-neutral-content<br />
                                    --color-base-100<br />
                                    --color-base-200<br />
                                    --color-base-300<br />
                                    --color-base-content
                                </CodeBlock>
                            </div>
                            <div>
                                <h3 className="font-semibold text-base-content mb-3">Status Variables:</h3>
                                <CodeBlock>
                                    --color-info<br />
                                    --color-info-content<br />
                                    --color-success<br />
                                    --color-success-content<br />
                                    --color-warning<br />
                                    --color-warning-content<br />
                                    --color-error<br />
                                    --color-error-content
                                </CodeBlock>
                            </div>
                        </div>
                    </div>

                    {/* Quick Reference */}
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-base-content mb-4">
                            ⚡ Quick Reference Cheat Sheet
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-base-content mb-3">Most Common Conversions:</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <code className="text-error">bg-white</code>
                                        <span>→</span>
                                        <code className="text-success">bg-base-100</code>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="text-error">text-gray-900</code>
                                        <span>→</span>
                                        <code className="text-success">text-base-content</code>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="text-error">text-gray-500</code>
                                        <span>→</span>
                                        <code className="text-success">text-base-content/60</code>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="text-error">border-gray-200</code>
                                        <span>→</span>
                                        <code className="text-success">border-base-300</code>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="text-error">text-primary-600</code>
                                        <span>→</span>
                                        <code className="text-success">text-primary</code>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-base-content mb-3">Search & Replace Patterns:</h3>
                                <div className="space-y-2 text-sm">
                                    <div>Find: <code className="bg-base-300 px-1 rounded">dark:bg-dark-</code></div>
                                    <div>Find: <code className="bg-base-300 px-1 rounded">dark:text-dark-</code></div>
                                    <div>Find: <code className="bg-base-300 px-1 rounded">dark:border-dark-</code></div>
                                    <div>Find: <code className="bg-base-300 px-1 rounded">bg-gray-</code></div>
                                    <div>Find: <code className="bg-base-300 px-1 rounded">text-slate-</code></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DaisyUIWrapper>
    );
}
