/** @type {import('jest').Config} */
module.exports = {
    roots: ['<rootDir>/src'],
    moduleDirectories: ['node_modules', 'src'],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

    transform: {
        '^.+\\.(js|jsx|mjs|cjs)$': ['babel-jest', { configFile: './.babelrc' }],
    },

    transformIgnorePatterns: [
        'node_modules/(?!(@bundled-es-modules|msw|@mswjs|@babel/runtime|@open-draft)/)'
    ],

    testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons'],
    },

    // Setup files to run before each test
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/index.js',
        '!src/reportWebVitals.js',
        '!src/**/*.d.ts',
    ],

    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
    ],

    moduleNameMapper: {
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
        '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js',
    },

    // Handle experimental features
    resolver: undefined,
    testRunner: 'jest-circus/runner',
};
