import styles from './App.module.css'

export function App() {
    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <h1 className={styles.brand}>RabbitDock</h1>
            </aside>
            <main className={styles.content}>
                <p className={styles.empty}>No modules installed yet.</p>
            </main>
        </div>
    )
}
