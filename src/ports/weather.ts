export type Weather = {
  location: string
  temperature: string
  condition: string
  icon: string
}

export type WeatherPort = {
  read(): Promise<Weather | null>
}
