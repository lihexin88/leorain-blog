import axios from 'axios'

export function getWeather () {
  return axios.get('https://wttr.in/?format=j1&lang=zh').then(response => {
    return {
      temperature: response.data.current_condition[0].temp_C,
      temperature_feels_like: response.data.current_condition[0].FeelsLikeC,
      weather: response.data.current_condition[0].lang_zh[0].value,
      wind_direction: toDirStr(response.data.current_condition[0].winddirDegree),
      wind_speed: Math.floor((response.data.current_condition[0].windspeedMiles / 3.6) * 100) / 100
    }
  })
}
function toDirStr (num) {
  num = parseInt(num)
  const N = '北'
  const E = '东'
  const S = '南'
  const W = '西'
  let dir = ''

  if (num === 0 || num === 360) {
    dir = '正' + N
  } else if (num < 90 && num > 0) {
    if (num < 45) {
      dir = N + '偏' + E + num + ' °'
    } else if (num === 45) {
      dir = E + N + num + ' °'
    } else if (num > 45) {
      dir = E + '偏' + N + (90 - num) + ' °'
    }
  } else if (num === 90) {
    dir = '正' + E
  } else if (num < 180 && num > 90) {
    if (num < 135) {
      dir = E + '偏' + S + (num - 90) + ' °'
    } else if (num === 135) {
      dir = E + S + (num - 90) + ' °'
    } else if (num > 135) {
      dir = S + '偏' + E + (180 - num) + ' °'
    }
  } else if (num === 180) {
    dir = '正' + S
  } else if (num < 270 && num > 180) {
    if (num < 225) {
      dir = S + '偏' + W + (num - 180) + ' °'
    } else if (num === 225) {
      dir = W + S + (num - 180) + ' °'
    } else if (num > 225) {
      dir = W + '偏' + S + (270 - num) + ' °'
    }
  } else if (num === 270) {
    dir = '正' + W
  } else if (num < 360 && num > 270) {
    if (num < 315) {
      dir = W + '偏' + N + (num - 270) + ' °'
    } else if (num === 315) {
      dir = W + N + (num - 270) + ' °'
    } else if (num > 315) {
      dir = S + '偏' + W + (360 - num) + ' °'
    }
  }

  return dir
}
