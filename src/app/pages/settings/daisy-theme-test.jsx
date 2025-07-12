import { DaisyThemeSwitcher } from 'components/shared/DaisyThemeSwitcher';

export default function DaisyThemeTest() {
    return (
        <div className="min-h-screen bg-base-100 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-base-content mb-8">
                    DaisyUI Theme System Demo
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Theme Controls</h2>
                        <DaisyThemeSwitcher />
                    </div>

                    <div className="bg-base-200 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Component Examples</h2>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-3">Buttons</h3>
                            <div className="flex flex-wrap gap-2">
                                <button className="btn btn-primary">Primary</button>
                                <button className="btn btn-secondary">Secondary</button>
                                <button className="btn btn-accent">Accent</button>
                                <button className="btn btn-neutral">Neutral</button>
                                <button className="btn btn-info">Info</button>
                                <button className="btn btn-success">Success</button>
                                <button className="btn btn-warning">Warning</button>
                                <button className="btn btn-error">Error</button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-3">Cards</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="card bg-base-100 shadow-xl">
                                    <div className="card-body">
                                        <h2 className="card-title">Budget Overview</h2>
                                        <p>Your financial dashboard with DaisyUI theming</p>
                                        <div className="card-actions justify-end">
                                            <button className="btn btn-primary">View Details</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-primary text-primary-content">
                                    <div className="card-body">
                                        <h2 className="card-title">Monthly Budget</h2>
                                        <p>Track your expenses and savings goals</p>
                                        <div className="card-actions justify-end">
                                            <button className="btn">Get Started</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-3">Alerts</h3>
                            <div className="space-y-2">
                                <div className="alert alert-info">
                                    <span>New budget features are available!</span>
                                </div>
                                <div className="alert alert-success">
                                    <span>Your budget has been saved successfully.</span>
                                </div>
                                <div className="alert alert-warning">
                                    <span>You are approaching your spending limit.</span>
                                </div>
                                <div className="alert alert-error">
                                    <span>Failed to sync with cloud storage.</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-3">Form Elements</h3>
                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Transaction Amount</span>
                                    </label>
                                    <input type="text" placeholder="$0.00" className="input input-bordered" />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Category</span>
                                    </label>
                                    <select className="select select-bordered">
                                        <option disabled selected>Select category</option>
                                        <option>Food and Dining</option>
                                        <option>Transportation</option>
                                        <option>Entertainment</option>
                                        <option>Utilities</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label cursor-pointer">
                                        <span className="label-text">Recurring Transaction</span>
                                        <input type="checkbox" className="checkbox checkbox-primary" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-3">Progress and Stats</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Budget Progress</span>
                                        <span>65%</span>
                                    </div>
                                    <progress className="progress progress-primary" value="65" max="100"></progress>
                                </div>

                                <div className="stats shadow">
                                    <div className="stat">
                                        <div className="stat-title">Total Spent</div>
                                        <div className="stat-value text-primary">$2,400</div>
                                        <div className="stat-desc">21% more than last month</div>
                                    </div>

                                    <div className="stat">
                                        <div className="stat-title">Remaining Budget</div>
                                        <div className="stat-value text-secondary">$1,200</div>
                                        <div className="stat-desc">35% of monthly budget</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-base-200 p-8 rounded-lg">
                    <h2 className="text-2xl font-bold mb-6">DaisyUI Theming Benefits</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-base-100 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-primary mb-3">🎨 Simple Theme Switching</h3>
                            <p className="text-base-content/80">
                                Change your entire app color scheme with a single data attribute.
                                No more complex CSS variable management.
                            </p>
                        </div>

                        <div className="bg-base-100 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-secondary mb-3">🌈 30+ Built-in Themes</h3>
                            <p className="text-base-content/80">
                                Choose from professional themes like Corporate, or fun ones like Cyberpunk.
                                Each theme is carefully designed and tested.
                            </p>
                        </div>

                        <div className="bg-base-100 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-accent mb-3">🔧 Easy Customization</h3>
                            <p className="text-base-content/80">
                                Create custom themes that match your brand.
                                All components automatically adapt to your color scheme.
                            </p>
                        </div>

                        <div className="bg-base-100 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-info mb-3">📱 Responsive Design</h3>
                            <p className="text-base-content/80">
                                All themes work perfectly on mobile and desktop.
                                Consistent experience across all devices.
                            </p>
                        </div>

                        <div className="bg-base-100 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-success mb-3">♿ Accessibility First</h3>
                            <p className="text-base-content/80">
                                Every theme meets WCAG guidelines with proper contrast ratios
                                and screen reader support.
                            </p>
                        </div>

                        <div className="bg-base-100 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-warning mb-3">⚡ Performance Optimized</h3>
                            <p className="text-base-content/80">
                                CSS-only theming means no JavaScript overhead.
                                Themes switch instantly without re-renders.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-base-300 p-8 rounded-lg">
                    <h2 className="text-2xl font-bold mb-6">How Simple It Is</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-error">❌ Before (Complex)</h3>
                            <div className="mockup-code">
                                <pre data-prefix="1"><code>{`Multiple theme files`}</code></pre>
                                <pre data-prefix="2"><code>{`Complex CSS variables`}</code></pre>
                                <pre data-prefix="3"><code>{`Separate light/dark logic`}</code></pre>
                                <pre data-prefix="4"><code>{`Primary color management`}</code></pre>
                                <pre data-prefix="5"><code>{`Manual color coordination`}</code></pre>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-success">✅ After (Simple)</h3>
                            <div className="mockup-code">
                                <pre data-prefix="1"><code>{`One line theme switch`}</code></pre>
                                <pre data-prefix="2"><code>{`document.documentElement`}</code></pre>
                                <pre data-prefix="3"><code>{`  .setAttribute('data-theme', 'dark')`}</code></pre>
                                <pre data-prefix="4"><code>{``}</code></pre>
                                <pre data-prefix="5"><code>{`That's it! 🎉`}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
