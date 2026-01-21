# medical-research-front

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```


### 部署
1. 
2. D:\work\tool\nginx-1.20.2
3. cd /d D:\nginx-1.20.2
4. start nginx.exe
5. nginx -s quit
6. nginx -s reload
7. nginx -v
8. nginx -t
3. config 配置
   
4. 数据库部署
   4.1 数据库配置my.ini
      [mysqld]
       port=3306
       basedir=D:\mysql-8.0.44-winx64
       datadir=D:\mysql-8.0.44-winx64\data
       max_connections=200
       character-set-server=utf8mb4
       default-storage-engine=INNODB

       [mysql]
       default-character-set=utf8mb4
   4.2 初始化数据库
      # 初始化（生成临时密码，注意记录！）
      mysqld --initialize --console
      # 安装服务（服务名可自定义，如MySQL）
      mysqld --install MySQL
      # 启动服务
      net start MySQL
      # 修改root密码（替换临时密码和新密码）
      mysql -u root -p
      ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
      FLUSH PRIVILEGES;
