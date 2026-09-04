/**
 * A porta pública do sorteio.
 *
 * `data/raffle-notifications` é lógica pura (cálculo de intervalo de polling
 * com backoff e jitter) e por isso pode ser reexportada aqui sem arrastar
 * servidor para o bundle do cliente.
 */

export { RaffleNotifier } from './ui/components/raffle-notifier'
export { WinnerCard } from './ui/components/winner-card'
export { WinnerModal } from './ui/components/winner-modal'
export { RaffleView } from './ui/views/raffle-view'
