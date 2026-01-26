import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".")
  return parseFloat(cleaned) || 0
}

export function formatDate(date: string | undefined): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("pt-BR")
}
