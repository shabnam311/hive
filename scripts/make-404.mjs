import { readFileSync, writeFileSync } from "fs";

const html = readFileSync("dist/index.html", "utf8");

const redirectScript = `<script>
(function(){
  var seg = '/hive';
  var l = window.location;
  if (l.pathname.indexOf(seg) === 0 && l.pathname !== seg + '/' && l.pathname !== seg + '/index.html') {
    var path = l.pathname.slice(seg.length) || '/';
    l.replace(l.protocol+'//'+l.hostname+(l.port?':'+l.port:'')+seg+'/?p='+encodeURIComponent(path)+(l.search?'&q='+encodeURIComponent(l.search.slice(1)):'')+l.hash);
  }
})();
</script>`;

const fixed = html.replace("</head>", redirectScript + "\n</head>");
writeFileSync("dist/404.html", fixed);
console.log("dist/404.html created with SPA redirect");