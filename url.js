const {URL}=require('url');
const u=new URL(
    'https://www.example.com:8080/'+
    'products/list?category=books'+
    '&sort=asc#section2'
);
console.log(u.protocol);
console.log(u.hostname);
console.log(u.port);
console.log(u.pathname);
console.log(u.hash);
u.searchParams.forEach((value,key)=>{
    console.log(key,'=',value);
});
