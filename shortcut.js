var H5P = H5P || {};

H5P.Shortcut = (function ($) {
  /**
   * Constructor function.
   */
  function C(options, id) {
    this.$ = $(this);
    // Extend defaults with provided options
    this.options = $.extend(true, {}, {
      'shortcutMode': 'content',
      'preventTrigger': 'all',
      'showStartButton': true,
      'pressButtonToStart': 'Press the button to start the activity',
      'startButton': 'Start',
      'pressKeys': 'Press the following keys on your keyboards',
      'continueButton': 'Continue'
    }, options);
    // Keep provided id.
    this.id = id;
  };

  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    var self = this;

    let success = false;

    // Split shortcut key, case where the key + is part of the shortuct (Ctrl++ or Ctrl+++a) need to be handled
    // Split work with regex, if there are matching parenthesis, they are included,
    // however it will need to be clean from undefined and empty string that might appear

    const KEYS = this.options.shortcut.keys.split(/(?:(?:^|\+)(\+)(?:\+|$))|\+/).filter(x => x !== undefined && x != '');
    const KEYSTEXT = this.options.shortcut.keysText.split(/(?:(?:^|\+)(\+)(?:\+|$))|\+/).filter(x => x !== undefined && x != '');

    // Set class on container to identify it as a greeting card
    // container.  Allows for styling later.
    $container.addClass("h5p-shortcut");

    let keyHtml = KEYSTEXT.map(function (key) {
      return '<span class="key">' + key.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
    }).join(' + ');

    $container.append('<div class="startbutton hidden">' + this.options.pressButtonToStart + '<br /><br /><button class="h5p-core-button" type="button">' + this.options.startButton + '</button></div>');
    $container.append('<div class="shortcut hidden">' + this.options.pressKeys + '<br /><br />' + keyHtml + '</div>');
    $container.append('<div class="results"></div>');
    $container.append($('<div class="successText hidden">').html(this.options.successText));

    if (this.options.showStartButton) {
      $container.find('.startbutton').removeClass('hidden');
      $container.find('.startbutton>button').click(function () {
        $container.find('.startbutton>button').text(self.options.continueButton);
        $container.find('.startbutton').addClass('hidden');
        $container.find('.shortcut').removeClass('hidden');
      });

      window.addEventListener('blur', e => {
        if (!success) {
          $container.find('.shortcut').addClass('hidden');
          $container.find('.startbutton').removeClass('hidden');
        }
      });
    } else {
      $container.find('.shortcut').removeClass('hidden');
    }
    window.addEventListener('blur', e => {
      if (!success) {
        // Check if last key is a blur
        if (KEYS[KEYS.length - 1] === 'blur' && $container.find('.shortcut .key.pressed').length == KEYS.length - 1) {
          $container.find('.shortcut .key').last().addClass('pressed');
          $container.find('.startbutton').addClass('hidden');
          $container.find('.shortcut').removeClass('hidden');
          C.success();
        }
      }
    });

    document.addEventListener('keydown', e => {
      let key = this.options.shortcutMode == 'content' ? e.key : e.code;
      let keyIndex = KEYS.indexOf(key);
      if (keyIndex !== -1) {
        $container.find('.shortcut .key').eq(keyIndex).addClass('pressed');
        if ($container.find('.shortcut .key').length == $container.find('.shortcut .key.pressed').length) {
          (this.options.preventTrigger === "all" || this.options.preventTrigger === "shortcutOnly") && e.preventDefault();
          if (!success) {
            C.success();
          }
        } else {
          (this.options.preventTrigger === "all" || this.options.preventTrigger === "allButShortcut") && e.preventDefault();
        }
      }
    });

    document.addEventListener('keyup', e => {
      if (!success) {
        let key = this.options.shortcutMode == 'content' ? e.key : e.code;
        let keyIndex = KEYS.indexOf(key);
        if (keyIndex !== -1) {
          $container.find('.shortcut .key').eq(keyIndex).removeClass('pressed');
        }
      }
    });

    C.success = function () {
      self.triggerXAPIScored(1, 1, 'answered');
      scoreBar = H5P.JoubelUI.createScoreBar(1);
      scoreBar.setScore(1);
      scoreBar.appendTo($container.find('.results'));
      $container.find('.successText').removeClass('hidden');
      self.$.trigger('resize'); // not working !
      success = true;
    }

    this.triggerXAPI('attempted');

    setTimeout(function () {
      self.$.trigger('resize');
    }, 1000);
  };

  return C;
})(H5P.jQuery);
