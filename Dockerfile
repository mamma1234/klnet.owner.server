FROM node:latest
RUN mkdir -p /usr/src/klnet.owner.node
WORKDIR /usr/src/klnet.owner.node
COPY java/jdk-8u101-linux-x64.tar.gz /usr/local/jdk/
RUN tar -zxf /usr/local/jdk/jdk-8u101-linux-x64.tar.gz -C /usr/local/jdk/
ENV JAVA_HOME="/usr/local/jdk/jdk1.8.0_101"
ENV PATH $PATH:$JAVA_HOME/bin
COPY package.json ./
RUN yarn install
RUN apt-get update && apt-get install -y libaio1
COPY . .
ADD instantclient_19_5/* /opt/oracle/instantclient_19_5/
RUN echo /opt/oracle/instantclient_19_5 > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig
ENV LD_LIBRARY_PATH="/opt/oracle/instantclient_19_5"
EXPOSE 5000
CMD ["node","server"]