create private key - do not push that to git
openssl genrsa -out private_key.pem 2048


create public key
openssl rsa -pubout -in private_key.pem -out public_key.pem

add your public key to aws key and create key group
fix the access in cloudfront distribution