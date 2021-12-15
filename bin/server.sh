cd ..

docker build -t klnet.owner.node .

docker stop server

docker run -d -it --rm --name "server" --network server -p 5001:5000 -v /DATA/KLNET/OWNER:/OWNER klnet.owner.node

echo "build finish"

docker logs -f server
