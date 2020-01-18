## Pre-flight

Automatically build task lists for every pull request based on information in your commit messages. 

Pre-flight automatically and continuously collects the tasks you've mentioned in your commit messages and adds them as a [task list](https://help.github.com/en/github/managing-your-work-on-github/about-task-lists) to the pull request's description. It also will also display a failed check on the pull request until all tasks are marked as completed.

### Usage

Whenever you're committing a change, if that change will require some manual action to happen before it's merged to production (or to any other environment, for that matter), you put down tasks inside the commit message. A basic task looks like this -

`[]: don't forget that important thing`

Just a pair for square brackets, followed by a colon and then the task definition. The task definition can be as long as you like, but can't contain line breaks. There will also be an easy link to the commit, so you can add more details in the rest of the commit message.
Branch Conditioning

#### Branch Conditioning

By default, any PR will collect all the tasks in all of it's commits. However, sometimes a task is only relevant for a specific environment. For example, you may want to only show the task when merging to master. In that case, the syntax is -

`[](master): I'm only relevant for production`

You can also specify multiple branches using pipes -

`[](master|dev): I'm only relevant for prod/staging`


### Privacy

The [Pre-flight GitHub Marketplace application](https://github.com/marketplace/pre-flight) is backed by an `ApiGateway`/`Lambda` setup running on my personal AWS account. I am not interested in your information and do not intentionally collect any information that is passed to the app. I also don't log any details for any of the requests coming in. 

All of the above not withstanding - I am a private person with very limited time and resources. If you feel uncomfortable having your information passing through my server, do not use the public app. If you still would like to have this functionality, you can pretty easily build on top of this repository and host your own server. If you need help setting it up feel free to ping me.

### Availability

As mentioned above, The [Pre-flight GitHub Marketplace application](https://github.com/marketplace/pre-flight) is running on my personal AWS account with some serverless infrastructure. This means that running this tool is relatively cheap, but I can't promise to keep it available or free forever. I may decide to shut it down without notice. If you rely on this service in any way, I would advice setting up your own hosted backend to remove this dependency.

### License

[ISC](LICENSE) © 2020 Nimrod Dolev

##### Logo

The Pre-flight logo is based a modification of a couple of icons by the fabulous folks at [Font Awesome](https://fontawesome.com). As per [their license](https://fontawesome.com/license) I'm obliged to inform you that I am not associated with Font Awesome and they do not endorse me or my work.
