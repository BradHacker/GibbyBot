const fetch = require('node-fetch');
const moment = require('moment');
const Discord = require('discord.js');

let WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
let UTC_OFFSET = -4;

const getDiningLocationsEmbed = (msg) => {
  let now = moment(msg.createdAt).set('hour', msg.createdAt.getHours() + UTC_OFFSET);
  let dayOfWeek = WEEKDAYS[now.weekday()];

  // console.log(now.format('MM-DD-YYYY hh:mm:ss'))
  // console.log(now.utcOffset());
  // console.log(msg.createdAt.toISOString());
  // console.log(msg.createdTimestamp);
  // console.log(new Date(msg.createdTimestamp).getHours() + UTC_OFFSET);
  // console.log(new Date(msg.createdTimestamp).getMinutes());

  let diningLocations = [];

  return new Promise((resolve, reject) => fetch(`https://tigercenter.rit.edu/tigerCenterApp/tc/dining-all?date=${now.format('YYYY-MM-DD')}`)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data.locations[0])
      data.locations.forEach((location) => {
        let open = false;
        let menusChecked = [];
        let openMenu = '';
        let hours = {
          open: '',
          close: ''
        }
        location.events.forEach((event) => {
          if (event.daysOfWeek.indexOf(dayOfWeek) === -1) return;
          if (now.isBetween(event.startDate, event.endDate) && menusChecked.indexOf(event.name) === -1) {
            menusChecked.push(event.name)
            let openTime = moment(event.startTime, 'hh:mm:ss')
            let closeTime = moment(event.endTime, 'hh:mm:ss')
            if (now.isBetween(openTime, closeTime)) {
              open = true;
              openMenu = event.name;
            }
            hours.open = openTime.format('h:mm')
            hours.close = closeTime.format('h:mm')
          }
          if (event.exceptions) {
            event.exceptions.forEach((exception) => {
              let openTime = moment(event.startTime, 'hh:mm:ss')
              let closeTime = moment(event.endTime, 'hh:mm:ss')
              if (now.isBetween(openTime, closeTime)) {
                open = exception.open;
                openMenu = open ? event.name : '';
              };
              hours.open = openTime.format('h:mm')
              hours.close = closeTime.format('h:mm')
            });
          }
        });
        // console.log(`${open ? 'open' : 'closed'} - ${location.name}`);
        diningLocations.push({
          name: location.name,
          mapsUrl: location.mapsUrl,
          isOpen: open,
          menuName: openMenu,
          hours
        });
      });
      // console.log(diningLocations[0])
      let embed = new Discord.MessageEmbed().setTitle("Dining Locations").setColor("#f5a142").setDescription("A current list of dining locations").setTimestamp();
      diningLocations.forEach(l => embed.addField(l.name,`${l.menuName}\n${l.hours.open}-${l.hours.close}\n\`${l.isOpen ? 'Open' : 'Closed'}\``, true))
      resolve(embed);
    }).catch(err => reject(err))
  )
}

module.exports = getDiningLocationsEmbed;