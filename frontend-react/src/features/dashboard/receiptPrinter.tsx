import { createContext, useContext } from 'react';
import type { OrderResponse } from '../../lib/types';

/* Lets any button anywhere under the Shell (KDS board, order history, …) trigger a RawBT
 * receipt print without prop-drilling through every intermediate component. Shell owns the
 * actual state (ReceiptCapture.tsx) and provides the trigger function down via this context —
 * kept in its own file since DashboardApp.tsx and OrdersPage.tsx already import each other. */
const Ctx = createContext<(order: OrderResponse) => void>(() => {});

export const ReceiptPrinterProvider = Ctx.Provider;
export const useReceiptPrinter = () => useContext(Ctx);
