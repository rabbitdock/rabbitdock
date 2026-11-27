import { useState } from 'react'

// Only proves the path from a separate build to a page inside the app. The counter uses a hook,
// which fails when the module and the app run different copies of React.
export default function HelloPage() {
    const [clicks, setClicks] = useState(0)
    return (
        <section>
            <h2>Hello from a module</h2>
            <button type="button" onClick={() => setClicks(clicks + 1)}>
                Clicked {clicks} times
            </button>
        </section>
    )
}
