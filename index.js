var request = require('request')
var cheerio = require('cheerio')
var fs = require('fs')
var RSVP = require('rsvp')
var config = require('./config')
var cliArgs = require('command-line-args')

var BASE_DL_DIR = config.baseDownloadDir
var BASE_SITE_URL = config.baseSiteUrl
var options = cliArgs([
  { name: 'galleries', alias: 'g', defaultOption: true }
])


// 'main' controller. Will loop through a list of
// gallery names
var loadGalleries = (baseUrl, galleryNames) => {
  if(galleryNames.length == 0) return
  galleryName = galleryNames.shift()
  console.log(`Loading gallery ${galleryName}`)
  loadGallery(baseUrl, galleryName).
    then(($) => {
      prepGalleryDir(galleryName).
        then((galleryDir) => {
          images = $("div.gallery").find("a.wp-img-bg-off").toArray()
          console.log(`Found ${images.length} images`)
          downloadImages(images, galleryDir).
            then(() => {
              console.log(`Gallery ${galleryName} completed`)
              loadGalleries(baseUrl, galleryNames)
            })
        })
    }).catch((e) => {
      console.log(e)
    })
}

// My only job is to load a gallery
// And convert it into a $
// Need to return a promise to whoever knows
// what to do with the gallery
var loadGallery = (baseUrl, galleryName) => {
  uri = baseUrl + galleryName
  console.log(`Connecting to ${uri}`)
  return new RSVP.Promise((resolve, reject) => {
    request(uri, (error, response, html) => {
      if(error) {
        reject(error)
      }else {
        console.log(`Loaded gallery. Document length: ${html.length}`)
        var $ = cheerio.load(html)
        resolve($)
      }
    })
  })
}

var normalizeGalleryName = (galleryName) => {
  return galleryName.replace(/\//g, '_')
}

var prepGalleryDir = (galleryName) => {
  return new RSVP.Promise((resolve, reject) => {
    var dir = BASE_DL_DIR + '/' + normalizeGalleryName(galleryName)
    console.log(`Prepping gallery dir ${dir}`)
    if(!fs.existsSync(dir)){
      fs.mkdir(dir, (err) => {
        if(err) reject(err)
        else resolve(dir)
      })
    }else {
      resolve(dir)
    }
  })
}

// Given a list of image URLs and a target dir, this
// will download the images into the target dir
var downloadImages = (images, galleryDir) => {
  return new RSVP.Promise((resolve, reject) => {
    if(images.length == 0){
      resolve()
    }else {
      currentImage = images.shift()
      downloadImage(currentImage.attribs['href'], galleryDir).
        then(() => {
          downloadImages(images, galleryDir).then(resolve)
        }).
        catch((err) => {
          console.log(err)
          reject(err)
        })
    }
  })
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

var downloadImage = (uri, galleryDir) => {
  return new RSVP.Promise((resolve, reject) => {
    request.head(uri, (err, res, body) => {
      if(err){
        console.log(err)
        reject(err)
      }else {
        filename = generateFilename(uri, res.headers)
        filePath = galleryDir + '/' + filename
        console.log(`Downloading ${uri} to ${filePath}`)
        resolve()
        request(uri).pipe(fs.createWriteStream(filePath)).
          on('finish', resolve).
          on('error', reject)
      }
    })
  })
}


galleryNames = options['galleries'].split(',')
console.log(`Galleries to process: ${galleryNames.length}`)
loadGalleries(BASE_SITE_URL, galleryNames)
