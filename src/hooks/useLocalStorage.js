import { useCallback, useRef, useState } from 'react'

import { useEventCallback, useEventListener } from 'hooks'

const IS_SERVER = typeof window === 'undefined'

export function useLocalStorage(
    key,
    initialValue,
    options = {},
) {
    const { initializeWithValue = true } = options

    // Use refs to store latest values without causing dependency issues
    const optionsRef = useRef(options)
    const initialValueRef = useRef(initialValue)

    // Update refs when values change
    optionsRef.current = options
    initialValueRef.current = initialValue

    const serializer = useCallback(
        value => {
            if (optionsRef.current.serializer) {
                return optionsRef.current.serializer(value)
            }

            return JSON.stringify(value)
        },
        [], // No dependencies to prevent recreation
    )

    const deserializer = useCallback(
        value => {
            if (optionsRef.current.deserializer) {
                return optionsRef.current.deserializer(value)
            }
            // Support 'undefined' as a value
            if (value === 'undefined') {
                return undefined
            }

            const defaultValue =
                initialValueRef.current instanceof Function ? initialValueRef.current() : initialValueRef.current

            let parsed
            try {
                parsed = JSON.parse(value)
            } catch (error) {
                console.error('Error parsing JSON:', error)
                return defaultValue // Return initialValue if parsing fails
            }

            return parsed
        },
        [], // No dependencies to prevent recreation
    )

    // Get from local storage then
    // parse stored json or return initialValue
    const readValue = useCallback(() => {
        const initialValueToUse =
            initialValueRef.current instanceof Function ? initialValueRef.current() : initialValueRef.current

        // Prevent build error "window is undefined" but keep working
        if (IS_SERVER) {
            return initialValueToUse
        }

        try {
            const raw = window.localStorage.getItem(key)
            return raw ? deserializer(raw) : initialValueToUse
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
            return initialValueToUse
        }
    }, [key, deserializer]) // Removed initialValue dependency

    const [storedValue, setStoredValue] = useState(() => {
        if (initializeWithValue) {
            return readValue()
        }

        return initialValue instanceof Function ? initialValue() : initialValue
    })

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = useEventCallback(value => {
        // Prevent build error "window is undefined" but keeps working
        if (IS_SERVER) {
            console.warn(
                `Tried setting localStorage key "${key}" even though environment is not a client`,
            )
        }

        try {
            // Allow value to be a function so we have the same API as useState
            const newValue = value instanceof Function ? value(readValue()) : value

            // Save to local storage
            window.localStorage.setItem(key, serializer(newValue))

            // Save state
            setStoredValue(newValue)

            // DISABLED: Custom event dispatch was causing infinite loops
            // Cross-tab synchronization will rely on native storage events only
            // const customEvent = new CustomEvent('local-storage', { detail: { key } })
            // window.dispatchEvent(customEvent)
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error)
        }
    })

    const removeValue = useEventCallback(() => {
        // Prevent build error "window is undefined" but keeps working
        if (IS_SERVER) {
            console.warn(
                `Tried removing localStorage key "${key}" even though environment is not a client`,
            )
        }

        const defaultValue =
            initialValueRef.current instanceof Function ? initialValueRef.current() : initialValueRef.current

        // Remove the key from local storage
        window.localStorage.removeItem(key)

        // Save state with default value
        setStoredValue(defaultValue)

        // DISABLED: Custom event dispatch was causing infinite loops
        // Cross-tab synchronization will rely on native storage events only
        // const customEvent = new CustomEvent('local-storage', { detail: { key } })
        // window.dispatchEvent(customEvent)
    })

    // DISABLED: This useEffect was causing infinite loops
    // The initial value is set in useState, so this sync is not critical
    // useEffect(() => {
    //     setStoredValue(readValue())
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [key]) // Only depend on key, not readValue to prevent infinite loops

    const handleStorageChange = useCallback(
        (event) => {
            // Get the key from either the event.key (native storage events) or event.detail.key (custom events)
            const eventKey = event?.key || event?.detail?.key

            // CRITICAL FIX: Only process events for THIS specific key
            if (eventKey && eventKey !== key) {
                return
            }

            // For custom events without a key in detail, ignore them
            if (event?.type === 'local-storage' && !event?.detail?.key) {
                return
            }

            // Use a fresh read instead of depending on readValue to prevent infinite loops
            const initialValueToUse =
                initialValueRef.current instanceof Function ? initialValueRef.current() : initialValueRef.current

            if (IS_SERVER) {
                setStoredValue(initialValueToUse)
                return
            }

            try {
                const raw = window.localStorage.getItem(key)
                const newValue = raw ? deserializer(raw) : initialValueToUse
                setStoredValue(newValue)
            } catch (error) {
                console.warn(`Error reading localStorage key "${key}":`, error)
                setStoredValue(initialValueToUse)
            }
        },
        [key, deserializer], // Only depend on key and deserializer, not readValue
    )

    // this only works for other documents, not the current one
    useEventListener('storage', handleStorageChange)

    // this is a custom event, triggered in writeValueToLocalStorage
    // See: useLocalStorage()
    useEventListener('local-storage', handleStorageChange)

    return [storedValue, setValue, removeValue]
}
