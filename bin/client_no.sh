cd ../material-react-mobx


docker build -t klnet.owner.web .


docker run -d -it --rm --name "client" --network server -p 80:80 -p 443:443 -v /DATA/KLNET/OWNER:/OWNER klnet.owner.web

echo "build finish"

docker logs -f client
