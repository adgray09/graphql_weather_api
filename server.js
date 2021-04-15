require('dotenv').config()
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fetch = require('node-fetch');
const cors = require('cors');


// graphql schema
const schema = buildSchema(`
type Test {
  message: String!
}

type Weather {
  temperature: Float
  description: String
  feels_like: String
  temp_min: Float
  temp_max: Float
  pressure: Float
  humidity: Float
  cod: Int
  message: String
}

type weekForecast {
  weekForecast: [Float!]!
}

enum Units {
  standard
  metric
  imperial
}

type Query {
  getWeather(zip: Int!, units: Units): Weather!
  getWeekForecast: weekForecast!
}


`)

const root = {
    getWeather: async ({ zip, units }) => {
        const apikey = process.env.OPENWEATHERMAP_API_KEY
        const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=${apikey}&units=${units}`
        const res = await fetch(url)
        const json = await res.json()

        if (json.cod == '404') {
            return { temperature: null, description: null, feels_like: null, temp_min: null, temp_max: null, pressure: null, humidity: null, cod: 404, message: "Invalid Zip"}
        } else {
            const temperature = json.main.temp
            const description = json.weather[0].description
            const feels_like = json.main.feels_like
            const temp_min = json.main.temp_min
            const temp_max = json.main.temp_max
            const pressure = json.main.pressure
            const humidity = json.main.humidity
            const cod = json.cod
            return { temperature, description, feels_like, temp_min, temp_max, pressure, humidity, cod}
        }
      },
      getWeekForecast: async () => {
        const apikey = process.env.OPENWEATHERMAP_API_KEY
        const url = `https://api.openweathermap.org/data/2.5/onecall?lat=38.3045&lon=-85.5815&appid=${apikey}&exclude=hourly,minutely&units=imperial`
        const res = await fetch(url)
        const json = await res.json()

        const weekForecast = []

        for(let i=0; i < json.daily.length; i++) {
          const grabTemperature = json.daily[i].temp
          const temperature = grabTemperature.day
          weekForecast.push(temperature)
        }
            
        return { weekForecast }
      },
  }

// create an express app
const app = express();

// apply middleware
app.use(cors());

app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
  }));

// Start this app
const port = 4000
app.listen(port, () => {
  console.log('Running on port:'+port)
})
