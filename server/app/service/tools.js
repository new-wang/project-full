const { Service } = require('egg')
const path = require('path')
const fse = require('fs-extra')
const nodemailer = require('nodemailer')


const userEmail = 'shengxinjing@126.com'
const transporter = nodemailer.createTransport({
  service: '126',
  secureConnection: true,
  auth: {
    user: userEmail,
    pass: 'a316783812',
  },
})


class ToolService extends Service {
  async mergeFile(filepPath, filehash, size) {
    const chunkdDir = path.resolve(this.config.UPLOAD_DIR, filehash) // 切片的文件夹
    
    let chunks = await fse.readdir(chunkdDir)
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    chunks = chunks.map(cp => path.resolve(chunkdDir, cp))
    // console.log('chunks',chunks)
    await this.mergeChunks(chunks, filepPath, size,chunkdDir)

  }
  async mergeChunks(files, dest, size,chunkdDir) {
    
    console.log('dest',dest)

    const pipStream = (filePath, writeStream) => new Promise(resolve => {
      const readStream = fse.createReadStream(filePath)
      readStream.on('end', () => {
        fse.unlinkSync(filePath)
        resolve()
      })
      readStream.pipe(writeStream)
    })

    await Promise.all(files.map((file, index) => {
        console.log('filedir',file)
        console.log('index',index)
        pipStream(file, fse.createWriteStream(dest, {
          start: index * size,
          end: (index + 1) * size,
        }))
      }));
    //合并后删除保存切片的目录
    console.log('chunkdDir',chunkdDir);
    
    // fse.rmdirSync(chunkdDir);
  }
  async sendMail(email, subject, text, html) {
    console.log(email, subject, html)
    const mailOptions = {
      from: userEmail,
      cc: userEmail,
      to: email,
      subject,
      text,
      html,
    }
    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (err) {
      console.log('email error', err)
      return false
    }
  }
}


module.exports = ToolService
