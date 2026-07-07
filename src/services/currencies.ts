import api from './api'

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
  listUserCurrencies: () =>
    api.get<UserCurrencyDetail[]>('/users/me/currencies'),

  updateUserCurrency: (currencyId: number, data: UpdateUserCurrencyPayload) =>
    api.patch<UserCurrencyDetail>(`/users/me/currencies/${currencyId}`, data),

  suggestRate: (from: number, to: number) =>
    api.get<{ rate: number | null }>('/users/me/currencies/exchange-rate', {
      params: { from, to },
    }),
}
