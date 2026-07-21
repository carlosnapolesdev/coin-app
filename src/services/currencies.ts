import api from './api'

export interface AvailableCurrency {
  id: number
  code: string
  name: string
  symbol: string | null
}

export interface UserCurrencyDetail {
  currencyId: number
  code: string
  name: string
  symbol: string | null
  exchangeRate: number
  base: boolean
  active: boolean
}

export interface UpdateUserCurrencyPayload {
  exchangeRate?: number
  base?: boolean
  active?: boolean
}

export const currenciesApi = {
  listAvailable: () => api.get<AvailableCurrency[]>('/currencies'),

  listUserCurrencies: () =>
    api.get<UserCurrencyDetail[]>('/users/me/currencies'),

  addUserCurrency: (currencyId: number, base: boolean) =>
    api.post<UserCurrencyDetail>('/users/me/currencies', { currencyId, base }),

  updateUserCurrency: (currencyId: number, data: UpdateUserCurrencyPayload) =>
    api.patch<UserCurrencyDetail>(`/users/me/currencies/${currencyId}`, data),

  suggestRate: (from: number, to: number) =>
    api.get<{ rate: number | null }>('/users/me/currencies/exchange-rate', {
      params: { from, to },
    }),
}
