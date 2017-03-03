var request = require('request')
var cheerio = require('cheerio')
var fs = require('fs')
var RSVP = require('rsvp')

var loadGallery = (uri) => {
  return new RSVP.Promise((resolve, reject) => {
    request(uri, (error, response, html) => {
      if(error) {
        reject(error)
      }else {
        var $ = cheerio.load(html)
        resolve($)
      }
    })
  })
}

var downloadImages = (images, stopAt) => {
  stopAt = stopAt || 0
  if(images.length == stopAt) return
  currentImage = images.shift()
  downloadImage(currentImage.attribs['href']).then(() => downloadImages(images)).catch((err) => console.log(err))
}

var generateFilename = (uri, headers) => {
  if(headers['content-disposition']){
    var disp = headers['content-disposition']
    // TODO
  }else{
    var lastUriToken = uri.split('/').pop()
    if(/\.[a-zA-Z0-9]+$/.test(lastUriToken)){
      return lastUriToken
    }else{
      var fileExtension = (() => {
        var result = ''
        switch(headers['content-disposition']){
          case 'image/jpeg':
            result = '.jpg'
            break;
        }
        return result
      })()
      return lastUriToken + fileExtension
    }
  }
}

var downloadImage = (uri, idx) => {
  return new RSVP.Promise((resolve, reject) => {
    request.head(uri, (err, res, body) => {
      if(err){
        console.log(err)
        reject(err)
      }else {
        filename = generateFilename(uri, res.headers)
        filePath = '/Users/amielperez/modelx/' + filename
        console.log("Downloading " + uri + " to " + filePath)
        resolve()
        request(uri).pipe(fs.createWriteStream(filePath)).
          on('finish', resolve).
          on('error', reject)
      }
    })
  })
}

galleryUrl = 'http://www.modelx.org/japanese-av-idols/special-contents/yuria-satomi-4/'
console.log `connecting to ${galleryUrl}`
loadGallery(galleryUrl).
  then(($) => {
    images = $("div.gallery").find("a.wp-img-bg-off").toArray()
    console.log("Found " + images.length + " images")
    downloadImages(images, images.length - 2)
  }).catch((err) => {
    console.error(err)
  })
