# unitube-lataamo-proxy

## Getting started

### Add .env file to project root with environment variables
LATAAMO_OPENCAST_HOST (OpenCast development url or local container's URL)\
LATAAMO_OPENCAST_PRESENTATION_HOST (OpenCast development url or local container's URL)\
LATAAMO_OPENCAST_USER (found in keepass)\
LATAAMO_OPENCAST_PASS (found in keepass)\
ENVIRONMENT (local development = local, devel environment = devel, test environment = test, prod environment = prod)\
ESB_HOST (esb host url, found in keepass)\
ESB_GROUPS_API_KEY (found in keepass)\
ESB_PERSONS_API_KEY (found in keepass)
REDIS_URL = redis://localhost
CRYPTO_SECRET_KEY=(found in keepass)
CRYPTO_SECRET_IV=(found in keepass)
AZURE_SPEECH_SUBSCRIPTION_KEY (found in keepass, deprecated use batch transcription instead)
STORAGE_ACCOUNT_NAME=(found in keepass)
STORAGE_ACCOUNT_KEY=(found in keepass)
STORAGE_CONTAINER_NAME=(found in keepass)
TRANSCRIPTION_API_KEY=(found in keepass)
SPEECH_TO_TEXT_BASE_URL=(found in keepass)
SPEECH_TO_TEXT_MODEL=(found in keepass)
GITLAB_TOKEN=(found in keepass)
GITLAB_HOST= (gitlab host url)

### Install FFMPEG for local development. Library is used to convert video files to mp4 format.
#### Windows
1. Download FFMPEG from https://ffmpeg.org/download.html#build-windows
2. Extract the zip file to C:\ffmpeg
3. Add C:\ffmpeg\bin to PATH environment variable
4. Restart your computer
5. Open command prompt and run `ffmpeg -version` to check that ffmpeg is installed correctly
6. If you get an error message about missing dll-files, download them from https://www.dll-files.com/ and place them in C:\ffmpeg\bin

#### Linux
1. `sudo apt install ffmpeg`
2. `ffmpeg -version` to check that ffmpeg is installed correctly

### OSX
1. `brew install ffmpeg`
2. `ffmpeg -version` to check that ffmpeg is installed correctly

#### Poistamo environment variables
POSTGRES_USER = (locally use the same username for which you used in the docker container otherwise username is found in keepass)
PASSWORD = (locally use the same password for which you used in the docker container otherwise password is found in keepass)
PORT = 5432
HOST = (locally use localhost, otherwise host is found in keepass)
DATABASE= (locally use the same database for which you used in the docker container otherwise database names are found in keepass)

### Install Redis for local development with Docker
`docker run -d -p 6379:6379 --name video-upload-status-storage redis`

#### If you need to run Redis-Cli commands inside Docker container
`docker exec -it video-upload-status-storage sh`\
\# `redis-cli`\
127.0.0.1:6379> `ping` --> should return Pong

### Use opencast docker to fake opencast (local development)
1. Clone the repository from GitHub: https://github.com/opencast/opencast-docker \
2. Edit `docker-compose.allinone.h2.yml` file found in `/opencast-docker/docker-compose` folder \
Find `image: quay.io/opencast/allinone:X.X` and change it to `image: quay.io/opencast/allinone:6.6` (14.7.2021)
3. `docker-compose -p opencast-allinone -f docker-compose/docker-compose.allinone.h2.yml up` \
4. To use archive workflow, add 2 xml-files (archive-delete.xml ja full-retract.xml) to opencast container folder /opencast/etc/workflows \
More info https://workgroups.helsinki.fi/pages/viewpage.action?pageId=128896753


## Important commands

### `npm install`
install required packages

### `npm start nodemon`
to start node server to localhost:3000
