FROM node:0.10
ADD ./package.json /superstatic/package.json
WORKDIR /superstatic
RUN npm install
ADD . /superstatic

VOLUME /data
WORKDIR /data

EXPOSE 80
ENTRYPOINT ["/superstatic/bin/server","-p","80","-o","0.0.0.0"]