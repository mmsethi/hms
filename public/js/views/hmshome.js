
$(document).ready(function(){

	function hmshomeController()
	{
		// bind event listeners to button clicks //
		var that = this;

		// handle user logout //
		$('#btn-logout').click(function(){ that.attemptLogout(); });
		this.attemptLogout = function()
		{
			var that = this;
			$.ajax({
				url: "/myaccount",
				type: "POST",
				data: {logout : true},
				success: function(data){
					that.showLockedAlert('You are now logged out.<br>Redirecting you back to the homepage.');
				},
				error: function(jqXHR){
					console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
				}
			});
		}

		this.showLockedAlert = function(msg){
			$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
			$('.modal-alert .modal-header h3').text('Success!');
			$('.modal-alert .modal-body p').html(msg);
			$('.modal-alert').modal('show');
			$('.modal-alert button').click(function(){window.location.href = '/';})
			setTimeout(function(){window.location.href = '/';}, 3000);
		}
	}

	var hc = new hmshomeController();

	$('button.accounts-btn').on('click',function(e){e.preventDefault();});
	$('.responsive-calendar').responsiveCalendar({
		onDayClick: function(events) { 
			var daydata=$(this).data();
			function format(number){
				if(number>=10){return number;
				}else{
					return "0"+number;
				}

			}
			clickeddate=format(daydata.day)+""+format(daydata.month)+""+daydata.year
			console.log(clickeddate); 
			window.location.href = '/hms/'+clickeddate;
		}

	});
});