<h1><i class="fa fa-magic"></i>IBM Connections Cloud Accounts Social Authentication</h1>
<hr />

<form class="sso-ibm-connections-cloud">
	<div class="alert alert-warning">
		<p>
			Register an <strong>Internal App</strong> via the
			<a href="https://apps.na.collabserv.com/manage/account/isv/input">Account Settings</a> and then paste your application details here.
		</p>
		<br />
		<input type="text" name="hostname" class="form-control" placeholder="your IBM Connections Cloud Hostname"><br />
		<input type="text" name="id" class="form-control" placeholder="your oAuth client id"><br />
		<input type="text" name="secret" class="form-control" placeholder="your oAuth secret">
		<p class="help-block">
			The appropriate "Redirect URI" is your NodeBB's URL with `/auth/ibm-connections-cloud/callback` appended to it.
		</p>
	</div>
</form>

<button class="btn btn-lg btn-primary" type="button" id="save">Save</button>

<script>
	require(['settings'], function(Settings) {
		Settings.load('sso-ibm-connections-cloud', $('.sso-ibm-connections-cloud'));

		$('#save').on('click', function() {
			Settings.save('sso-ibm-connections-cloud', $('.sso-ibm-connections-cloud'));
		});
	});
</script>