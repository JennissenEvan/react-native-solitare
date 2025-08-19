import { createContext } from "react";

const RefreshCardsContext = createContext(() => { console.warn("Card refresh context function is not defined!") });
export default RefreshCardsContext;
