(function() {
	var checkString;

  return {

  	requests: {
  		getAudits: function(ticket_id) { // Request for all audits on the ticket - JSON Response
  			return { 
  				url: helpers.fmt('/api/v2/tickets/%@/audits.json', ticket_id),
  				type: 'GET',
  				dataType: 'json',
  		};
  	},

  		updateSubject: function(ticket_id, dataToSend) { // Push the updated subject to the ticket - JSON PUT
  			return {
  				url: helpers.fmt('/api/v2/tickets/%@.json', ticket_id),
  				type: 'PUT',
  				dataType: 'json',
  				contentType: 'application/json',
  				data: JSON.stringify(dataToSend)
  		};
  	},

    	getSource: function(sourceLink) { // Request for the source view HTML of the email update - HTML Response
      		return {
        		url: sourceLink,
        		type: 'GET',
        		dataType: 'html'
      	};
    }

  },

    events: {
      'app.activated':'loading',
      'click #refreshNow': 'refresh',
      'click #updateSubject': 'updateSubjectAjax'
    },

    loading: function() {
      this.switchTo('loading');
      this.init();
    },

    refresh: function() {
    	services.notify('Refresh initialized...', 'notice');
    	this.loading();
    },

    init: function() { // Get all audits on the ticket.
    	var ticket_id = this.ticket().id();
    	var listAudits = this.ajax('getAudits', ticket_id);
    	listAudits.done(this.showInfo);
    	listAudits.fail(this.showError);
    },

    showInfo: function(data) { // Search audits for email updates - Latest first
      var entity = data;
      var totalCount = entity.count;
      totalCount--;
      for (i = totalCount; i >= 0; i--) {
        if (entity.audits[i].via.channel == 'email') {
          var foundID = i;
          break
        } else if (i == 0) {
          this.switchTo('noEmail');
  			return
        }

      }
      var currentAccount = this.currentAccount();
  	  var activeSubDomain = currentAccount.subdomain();
      var sourceLink = "https://" + activeSubDomain + ".zendesk.com/audits/" + entity.audits[foundID].id + "/email.html?ticket_id=" + this.ticket().id();
      var sourceHTML = this.ajax('getSource', sourceLink);
      sourceHTML.done(this.showHTML);
      sourceHTML.fail(this.showError);
    },

    showHTML: function(HTML) {
      var rawHTML = HTML;
      var b = rawHTML.indexOf("Subject");
      var e = rawHTML.indexOf("mail_bodies");
      var subString = rawHTML.substring(b, e);
      subString = subString.replace('</label>', '');
      subString = subString.replace('<div class="value">', '');
      subString = subString.replace('</div>', '');
      subString = subString.replace('</div>', '');
      subString = subString.replace('</div>', '');
      subString = subString.replace('<div id="', '');
      subString = subString.replace('Subject:', '');
      subString = subString.replace(/^\s*[\r\n]/gm, "");
      this.validateAppendix(subString);

    },

    validateAppendix: function(subject) {
      checkString = subject;
      var storedSubject = this.store(checkString);
      var userName = this.currentUser().name();
      var reg1 = /(#[0-9]{5,10})/i; 				//Ticket ID starting with a # - followed by 5 to 10 digits
      var reg2 = /(Ticket id:\s?[0-9]{5,10})/i; 	//Ticket ID starting with Ticket ID: - followed by 5 to 10 digits
      var matchFound = false;
      if (!new RegExp(reg1).test(checkString)) {
        console.log("No Match");
        matchFound = "-";
      } else {
        console.log("Match:" + checkString);
        matchFound = "Ticket ID has been found!";
      }
      if (!new RegExp(reg2).test(checkString)) {
        console.log("No Match");
        matchFound = "-";
      } else {
        console.log("Match:" + checkString);
        matchFound = "Ticket ID has been found!";
      }
      var currentSubject = this.ticket().subject();
      this.switchTo('showID', { subject: subject, match: matchFound, username: userName, currentSubject: currentSubject});


    },

    updateSubjectAjax: function() {
    	var ticket_id = this.ticket().id();
    	var dataToSend = {
    		"ticket":{
    		"subject":checkString.trim()
    	}
    };
    	var setSubject = this.ajax('updateSubject', ticket_id, dataToSend);
    	setSubject.done(this.updateSuccess);
    	setSubject.fail(this.showError);
    },



    updateSuccess: function() {
		services.notify('Subject updated', 'notice');
	},

    showError: function() {
		services.notify('An error has occurred, please try again later!', 'error');
	},
  };

}());
