
$(document).ready(function(){

	function hmsController()
	{

	// bind event listeners to button clicks //
		var that = this;

	// handle user logout //
		$('#btn-logout').click(function(){ that.attemptLogout(); });

	// confirm account deletion //
		$('#account-form-btn1').click(function(){$('.modal-confirm').modal('show')});

	// handle account deletion //
		$('.modal-confirm .submit').click(function(){ that.deleteAccount(); });

		this.deleteAccount = function()
		{
			$('.modal-confirm').modal('hide');
			var that = this;
			$.ajax({
				url: '/delete',
				type: 'POST',
				data: { id: $('#userId').val()},
				success: function(data){
		 			that.showLockedAlert('Your account has been deleted.<br>Redirecting you back to the homepage.');
				},
				error: function(jqXHR){
					console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
				}
			});
		}

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

	hmsController.prototype.onUpdateSuccess = function()
	{
		$('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });
		$('.modal-alert .modal-header h3').text('Success!');
		$('.modal-alert .modal-body p').html('Your account has been updated.');
		$('.modal-alert').modal('show');
		$('.modal-alert button').off('click');
	}

	var hc = new hmsController();
	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
	$('.modal-confirm .modal-header h3').text('Delete Account');
	$('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit').html('Delete');
	$('.modal-confirm .submit').addClass('btn-danger');

	$('button.accounts-btn').on('click',function(e){e.preventDefault();});
	$('#addNew').on('click',function(e){
		var tt=jQuery( ".account-controls" ).length;
		var ttnext=Number(tt+1);
	//	alert(Number(tt+1));
		//alert(tt.parent().html())
		$('#addNew').before('<div class="control-group" id="name-cg">\
				<div class="account-controls">\
				<input class="btn accounts-btn" type="text" name="button[]" value="">\
		        <input name="amount[]" value="" class="input-amount" type="text">\
				<label class="checkbox">Default</label>\
				<input class="checkbox" type="checkbox"  value="1" name="checkbox[]">\
		        </div></div>');
		jQuery('input[type="checkbox"]').checkbox();

	})
	jQuery('input[type="checkbox"]').checkbox();
		
		$('#submit-hms').on('click',function(){$('#account-form').submit()});
	});

	
	