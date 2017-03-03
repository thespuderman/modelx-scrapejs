### Modelx Gallery Downloader
This app can be used to download images from http://www.modelx.org
Only supports the JAV section (http://www.modelx.org/japanese-av-idols/) for now.

#### Pre-requisites
1. NodeJS (I plan to make this an Electron app for more portability)

#### Installation and Setup
1. Clone this repo using git (or download as archive and unpack)
2. Install the dependencies
  ```
  npm install
  ```
3. Create the config file
  ```
  mv config_template.js config.js
  ```
4. Edit the config file
  ```javascript
    module.exports = {
      baseDownloadDir: "/where/you/want/images/downloaded",
      baseSiteUrl: 'http://www.modelx.org/japanese-av-idols/'
    }
  ```
#### Usage
```
node index.js <comma-delimited-name-of-galleries>
```

A gallery is the part after the base URL. If the URL of the gallery you want downloaded is http://www.modelx.org/japanese-av-idols/xxxx/yyyy then your gallery name is xxxx/yyyy
