/*!
 * Craper v.1.0.0
 * Copyright 2014 kl-webmedia.com
 * 
 */

jQuery(document).ready(function ($) {

	"use strict";


	/**** carousel single move function 
	------------------------------------------------ ****/

	function caroSlider1(){
		if ($('.caro-1-col .caro-slider-ul').length) {
					
			$('.caro-1-col .caro-slider-ul').each(function() {
						var thisparent = $(this).parent();
						$(this).carouFredSel({
								auto: false,
								responsive: true,
								width: '100%',
								scroll: 1,
								items: {
									width: 370,
									visible: {
										min: 1,
										max: 1
									}},
								mousewheel: false,
								swipe: {
									onMouse: true,
									onTouch: true
								},
								prev: $('.caro-prev', thisparent),
								next: $('.caro-next', thisparent),
								pagination: $('.caro-pagination', thisparent)
								});
					});
			
			}
	}

	function caroSlider2(){
		if ($('.caro-fade .caro-slider-ul').length) {
					
			$('.caro-fade .caro-slider-ul').each(function() {
						var thisparent = $(this).parent();
						$(this).carouFredSel({

								auto: true,
								responsive: true,
								width: '100%',
								scroll: {
									items: 1,
									fx : "fade",
									easing : "linear",
									duration : 800,
									timeoutDuration : 2000
								},
								items: {
									width: 370,
									visible: {
										min: 1,
										max: 1
									}},
								mousewheel: false,
								swipe: {
									onMouse: true,
									onTouch: true
								},
								prev: $('.caro-prev', thisparent),
								next: $('.caro-next', thisparent),
								pagination: $('.caro-pagination', thisparent)
								});
					});
			
			}
	}

	caroSlider1();
	caroSlider2();


	/**** Roundabout carousel function 
	------------------------------------------------ ****/
	if ($('.roundabout-carousel').length){

		var control = $('.caro-controls',this);

		$('ul.roundabout', this).roundabout({
			responsive: true,
			btnNext: $('.caro-next', control),
			btnPrev: $('.caro-prev', control)
		});	
	
	}
	
	$(window).resize( function(){

	});

	if($("a[data-rel^='prettyPhoto']").length){
		$("a[data-rel^='prettyPhoto']").prettyPhoto({
			animation_speed:'normal',
			slideshow:3000,
			autoplay_slideshow: false,
			social_tools: false
		});
	}


	/*** Knob initialization > for circular progress bars etc.
	-------------------------------------------------------------  ***/
	if($(".knob").length !== 0){
	
		$(".knob").knob({
			draw : function () {
				$(this.i).val(this.cv + '%');
			}
		});
	
	}

	// Masonry Grids
	if ( $('.masonry-grid').length) {
		$('.masonry-grid').masonry({
			itemSelector: '.masonry-grid > li'
		});
	}
	
	// Filter tabs mixitup
	if ( $('.filter-list').length) {
		$('.filter-list').mixitup({
			layoutMode: 'grid',
			listClass: 'layout-list',
			gridClass: 'layout-grid',
			targetDisplayGrid: 'inline-block',
			targetDisplayList: 'block'
		});
	}
	
	
	if ( ! $('html').hasClass('ie-lt-10')){

		$('.filter-tabs').on('click', '.layout-list', function(){
			$('.filter-list').mixitup('toList');
			$('.filter-tabs .layout-grid').removeClass('active');
			$(this).addClass('active');
			
		});
	
		$('.filter-tabs').on('click', '.layout-grid', function(){
			$('.filter-list').mixitup('toGrid');
			$('.filter-tabs .layout-list').removeClass('active');
			$(this).addClass('active');
	
		});
		
	} else {

		$('.filter-tabs').on('click', '.layout-list', function(){
			$('.filter-tabs .layout-grid').removeClass('active');
			$('.filter-list').addClass('layout-list');	
			$('.filter-list').removeClass('layout-grid');	
			$(this).addClass('active');
			
		});
	
		$('.filter-tabs').on('click', '.layout-grid', function(){
			$('.filter-list').addClass('layout-grid');	
			$('.filter-list').removeClass('layout-list');	
			$('.filter-tabs .layout-list').removeClass('active');
			$(this).addClass('active');
		});

		
	}
	



	/*** Elements Animation ***/
	$('.animated').appear(function(){
		var el = $(this);
		var anim = el.data('animation');
		var animDelay = el.data('delay');
		if (animDelay) {

			setTimeout(function(){
				el.addClass( anim + " in" );
				el.removeClass('out');
			}, animDelay);

		}

		else {
			el.addClass( anim + " in" );
			el.removeClass('out');
		}    
		},{accY: -150});			
	
	
	/*** Animate Progess bar ***/
	$('.progress').each(function () {

		var progress = $(this);

		progress.appear(function () {

			var progressBar = $(this),

			percent = progressBar.find('.bar').data('cents'),
			centVal = percent + '%';
			progressBar.find('span').text(centVal);
			
			progressBar.find('.bar').animate({
				width: percent + '%'
			}, 800);

		});
	});
	
	
	
	
	/*** Accordion script ***/
	$(".accordion").accordion({
		header: "> dt",
		heightStyle: "content",
		collapsible: true
	});


	/*** Navigation in responsive layouts 
	--------------------------------------------------- ****/
	$('.main-nav').clone(true).appendTo('body').addClass('nav-tablet');
	
	if ( ! $('.nav-overlay-cover').legnth){
		$('<div class="nav-overlay-cover"></div>').appendTo('.pageWrapper');
	}

	$('.nav-tablet .menu li').has('ul').addClass('has-ul');
	$('.nav-tablet li.has-ul > a').on('click', this, function(e){
		$(this).next('ul').toggle();
		e.preventDefault();
	});

	$('.nav-button').on('click', this, function(){
		
		$(this).toggleClass('open');
		$('.nav-tablet, .nav-overlay-cover').toggleClass('open');

	});

	$('.nav-overlay-cover').on('click', function() {
		$(this).toggleClass('open');
		$('.nav-tablet, .nav-button').toggleClass('open');
	});

});