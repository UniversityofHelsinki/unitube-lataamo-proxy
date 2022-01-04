# unitube-lataamo-proxy

## Available Scripts

### `npm install`
install required packages

### Add .env file to project root with environment variables
LATAAMO_OPENCAST_HOST (OpenCast development url)\
LATAAMO_OPENCAST_PRESENTATION_HOST (Opencast development url)\
LATAAMO_OPENCAST_USER (found in keepass)\
LATAAMO_OPENCAST_PASS (found in keepass)\
ENVIRONMENT (local development = local, devel environment = devel, test environment = test, prod environment = prod)\
ESB_HOST (esb host url, found in keepass)\
ESB_GROUPS_API_KEY (found in keepass)\
ESB_PERSONS_API_KEY (found in keepass)

#### Poistamo environment variables
POSTGRES_USER = (locally use the same username for which you used in the docker container otherwise username is found in keepass)
PASSWORD = (locally use the same password for which you used in the docker container otherwise password is found in keepass)
PORT = 5432
HOST = (locally use localhost, otherwise host is found in keepass)
DATABASE= (locally use the same database for which you used in the docker container otherwise database names are found in keepass)

### Install Redis for local development with Docker
`docker run -d -p 6379:6379 --name video-upload-status-storage redis`
### If you need to run Redis-Cli commands inside Docker container
`docker exec -it video-upload-status-storage sh`\
\# `redis-cli`\
127.0.0.1:6379> `ping` --> should return Pong

### `npm start nodemon`
to start node server to localhost:3000

### Use opencast docker to fake opencast (local development)
1. Clone the repository from GitHub: https://github.com/opencast/opencast-docker \
2. Edit `docker-compose.allinone.h2.yml` file found in `/opencast-docker/docker-compose` folder \
Find `image: quay.io/opencast/allinone:X.X` and change it to `image: quay.io/opencast/allinone:6.6` (14.7.2021)
3. `docker-compose -p opencast-allinone -f docker-compose/docker-compose.allinone.h2.yml up`

