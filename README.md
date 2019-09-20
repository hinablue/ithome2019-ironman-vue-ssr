# 2019 ITHome Ironman simple ssr-app with docker

## Project setup

```
docker-compose up -d
```

### Compiles and minifies for production

```
docker-compose exec ironmanapp npm run build
```

### Test production localy

You MUST BE run `build` first, and,

```
docker-compose exec ironmanapp npm run dist
```

Open your browser and goto [http://localhost:8080](http://localhost:8080)


### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
