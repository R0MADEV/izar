export type ForecastDay = {
  label: string
  max: string
  min: string
  condition: string
}

export type Weather = {
  location: string
  temperature: string
  condition: string
  icon: string
  forecast: ForecastDay[]
}

export type WeatherPort = {
  read(): Promise<Weather | null>
}
